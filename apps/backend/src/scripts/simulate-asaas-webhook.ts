import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasWebhookService } from '../modules/asaas/asaas.webhook.service';

/**
 * Runtime smoke-test for Asaas webhook processing.
 *
 * What it does:
 * - Optionally creates a PENDING RECHARGE transaction (if WALLET_ID is provided)
 * - Fires a PAYMENT_CONFIRMED webhook event pointing externalReference to that transaction
 * - Prints resulting Transaction + Wallet state
 *
 * Usage:
 * - WALLET_ID=<uuid> npm run -w apps/backend start:dev (server not required for this script)
 * - WALLET_ID=<uuid> npx ts-node -r tsconfig-paths/register src/scripts/simulate-asaas-webhook.ts
 *
 * Optional env:
 * - WALLET_ID: wallet to create the pending recharge on
 * - TRANSACTION_ID: existing pending recharge transaction id to confirm
 * - AMOUNT: recharge amount (default 50)
 */

async function bootstrap() {
  const logger = new Logger('SimulateAsaasWebhook');
  const app = await NestFactory.createApplicationContext(AppModule);

  const prisma = app.get(PrismaService);
  const asaasWebhookService = app.get(AsaasWebhookService);

  try {
    const walletId = process.env.WALLET_ID;
    const explicitTransactionId = process.env.TRANSACTION_ID;
    const amountNumber = Number(process.env.AMOUNT || 50);
    const platformFeeNumber = Number(process.env.PLATFORM_FEE || 2.99);

    let transactionId = explicitTransactionId;

    if (!transactionId) {
      if (!walletId) {
        throw new Error(
          'Provide either TRANSACTION_ID (existing PENDING recharge) or WALLET_ID (to create one).',
        );
      }

      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        select: { id: true, balance: true, userId: true },
      });

      if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
      }

      const amount = new Prisma.Decimal(amountNumber);
      const platformFee = new Prisma.Decimal(platformFeeNumber);
      const grossAmount = amount.plus(platformFee);

      const pending = await prisma.transaction.create({
        data: {
          walletId: wallet.id,
          userId: wallet.userId,
          amount,
          platformFee,
          grossAmount,
          netAmount: amount,
          runningBalance: wallet.balance,
          type: 'RECHARGE',
          status: 'PENDING',
          description: 'Simulated recharge (for webhook test)',
        },
        select: { id: true },
      });

      transactionId = pending.id;
      logger.log(`Created PENDING recharge transaction: ${transactionId}`);
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(16).slice(2)}`;

    const event = {
      id: eventId,
      event: 'PAYMENT_CONFIRMED',
      payment: {
        id: paymentId,
        externalReference: transactionId,
      },
      account: null,
    };

    logger.log(
      `Firing Asaas webhook event ${event.event} -> externalReference=${transactionId}`,
    );

    await asaasWebhookService.handleWebhook(event);

    const updated = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: { select: { id: true, balance: true } } },
    });

    if (!updated) {
      throw new Error(`Transaction not found after webhook: ${transactionId}`);
    }

    logger.log(
      `Transaction status=${updated.status} amount=${updated.amount} platformFee=${updated.platformFee} grossAmount=${updated.grossAmount} netAmount=${updated.netAmount}`,
    );
    logger.log(
      `Wallet ${updated.walletId} newBalance=${updated.wallet.balance}`,
    );

    const report = {
      transactionId: updated.id,
      status: updated.status,
      amounts: {
        gross: Number(updated.grossAmount ?? 0),
        net: Number(updated.netAmount ?? 0),
        fee: Number(updated.platformFee ?? 0),
      },
      walletBalance: String(updated.wallet.balance),
    };

    console.log(JSON.stringify(report, null, 2));

    if (updated.status !== 'COMPLETED') {
      throw new Error(
        `Webhook did not complete the transaction. Current status: ${updated.status}`,
      );
    }

    logger.log('✅ Asaas webhook runtime smoke-test OK');
  } finally {
    await app.close();
  }
}

bootstrap().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
