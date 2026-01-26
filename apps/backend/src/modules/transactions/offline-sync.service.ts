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
      const newBalance = currentBalance - amount;
      let isOverdraft = false;

      // Scenario B: Insufficient Funds -> Overdraft
      if (newBalance < 0) {
        isOverdraft = true;
        this.logger.warn(
          `Offline Overdraft Detected: Wallet ${walletId}, Balance: ${currentBalance}, Amount: ${amount}`,
        );

        // Lock the wallet to prevent further purchases until recharge
        await tx.wallet.update({
          where: { id: walletId },
          data: {
            canPurchaseAlone: false,
            version: { increment: 1 },
          },
        });
      }

      // ... (Balance Update Logic Skiped for brevity in diff, assume standard update) ...

      if (!isOverdraft) {
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: newBalance, version: { increment: 1 } },
        });
      } else {
        await tx.wallet.update({
          where: { id: walletId },
          data: { balance: newBalance, version: { increment: 1 } },
        });
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

      // Audit Log for Overdraft (Fixed School ID)
      if (isOverdraft) {
        if (wallet.user?.schoolId) {
          await tx.auditLog.create({
            data: {
              schoolId: wallet.user.schoolId, // Real School ID
              action: 'OFFLINE_OVERDRAFT',
              entity: 'Wallet',
              entityId: walletId,
              meta: {
                offlineId,
                overdraftAmount: newBalance,
                previousBalance: currentBalance,
              },
            },
          });
        } else {
          this.logger.warn(
            `Could not audit overdraft for wallet ${walletId}: User has no school.`,
          );
        }
      }

      return { transactionId: transaction.id, newBalance, isOverdraft };
    });
  }
}
