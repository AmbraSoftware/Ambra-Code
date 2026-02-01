import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OfflineTransactionDto } from './dto/offline-transaction.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OfflineSyncService {
  private readonly logger = new Logger(OfflineSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process a batch of offline transactions directly from the queue.
   * Handles Scenario A (Solvent) and Scenario B (Insolvent/Overdraft).
   */
  async syncBatch(transactions: OfflineTransactionDto[]) {
    const results: any[] = [];

    for (const txData of transactions) {
      try {
        const result = await this.processSingleTransaction(txData);
        results.push({ offlineId: txData.offlineId, status: 'SYNCED', result });
      } catch (error: any) {
        this.logger.error(
          `Failed to sync transaction ${txData.offlineId}`,
          error,
        );
        results.push({
          offlineId: txData.offlineId,
          status: 'FAILED',
          error: error.message,
        });
      }
    }

    return results;
  }

  private async processSingleTransaction(txData: OfflineTransactionDto) {
    const { offlineId, walletId, amount, type, description, occurredAt } =
      txData;

    if (type === 'PURCHASE') {
      throw new Error(
        'Compra offline direta desabilitada. Utilize sincronização via /orders para garantir reserva de estoque e regras de negócio.',
      );
    }

    // Idempotency Check: Don't process if already synced
    const existing = await this.prisma.transaction.findUnique({
      where: { offlineId },
    });

    if (existing) {
      return { status: 'ALREADY_EXISTS', transactionId: existing.id };
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
        include: { user: { select: { schoolId: true } } },
      });

      if (!wallet) {
        throw new Error(`Wallet ${walletId} not found`);
      }

      const currentBalance = Number(wallet.balance);
      const amountDecimal = new Prisma.Decimal(amount);
      if (!amount || amount <= 0) {
        throw new Error('Valor inválido para débito offline.');
      }

      const newBalance = currentBalance - amount;
      if (newBalance < 0) {
        throw new Error('Saldo insuficiente.');
      }

      const { count } = await tx.wallet.updateMany({
        where: {
          id: walletId,
          balance: { gte: amountDecimal },
        },
        data: { balance: newBalance, version: { increment: 1 } },
      });

      if (count !== 1) {
        throw new Error('Saldo insuficiente.');
      }

      // Create Ledger Entry
      const transaction = await tx.transaction.create({
        data: {
          walletId,
          amount: amountDecimal.negated(), // Debit
          platformFee: 0,
          netAmount: amountDecimal.negated(),
          runningBalance: newBalance,
          type: type as any,
          status: 'COMPLETED',
          description: description || 'Offline Transaction',
          offlineId,
          syncedAt: new Date(),
          createdAt: new Date(occurredAt),
        },
      });

      return { transactionId: transaction.id, newBalance };
    });
  }
}
