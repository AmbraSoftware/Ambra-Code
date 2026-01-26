import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FiscalBatchService {
  private readonly logger = new Logger(FiscalBatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * PROCESSAMENTO DE LOTE FISCAL MENSAL
   * Consolida todas as micro-taxas (R$ 5,00) de um Operador em uma única Nota Fiscal.
   * Legal Defense: Garante emissão de NFSe sem inviabilizar o custo (R$ 0,20 por nota vs R$ 0,20 por lote).
   *
   * Agenda: Todo dia 1º do mês às 04:00 AM (CRON: 0 4 1 * *)
   */
  @Cron('0 4 1 * *') // Run at 4:00 AM on the 1st day of every month
  async processMonthlyBatch() {
    this.logger.log('Starting Monthly Fiscal Batch Processing...');

    // 1. Agrupar itens pendentes por Operador (Tomador do Serviço)
    // Isso requer uma query raw ou processamento em memória se o volume permitir.
    // Para V1, faremos em memória com chunking se necessário.

    const pendingItems = await this.prisma.fiscalPendingItem.findMany({
      where: { status: 'PENDING' },
      include: {
        operator: true,
        transaction: { include: { user: { select: { schoolId: true } } } },
      },
      take: 1000, // Batch Size de Segurança
    });

    if (pendingItems.length === 0) {
      this.logger.log('No pending fiscal items found.');
      return;
    }

    const batches = new Map<string, typeof pendingItems>();

    // Agrupa por OperatorID
    for (const item of pendingItems) {
      const key = item.operatorId;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key)?.push(item);
    }

    this.logger.log(
      `Found ${pendingItems.length} items across ${batches.size} operators.`,
    );

    // Processa cada Lote
    for (const [operatorId, items] of batches) {
      await this.createInvoiceForBatch(operatorId, items);
    }
  }

  private async createInvoiceForBatch(operatorId: string, items: any[]) {
    if (items.length === 0) return;

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const firstItem = items[0];
    const schoolId = firstItem.transaction?.user?.schoolId; // Pega escola do primeiro item (simplificação v1)

    if (!schoolId) {
      this.logger.error(
        `Cannot invoice batch for Operator ${operatorId}: School ID missing in transaction ref.`,
      );
      return;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Criar a Invoice (Nota Fiscal) Consolidada
        const invoice = await tx.invoice.create({
          data: {
            schoolId: schoolId,
            operatorId: operatorId,
            amount: new Prisma.Decimal(totalAmount),
            taxBase: new Prisma.Decimal(totalAmount),
            status: 'PENDING', // Vai para fila de emissão (PlugNotas)
            // transactionId é opcional no Schema v4.1 para Invoices de Lote
          },
        });

        // 2. Vincular os itens à Invoice e marcar como INVOICED
        const itemIds = items.map((i) => i.id);
        await tx.fiscalPendingItem.updateMany({
          where: { id: { in: itemIds } },
          data: {
            status: 'INVOICED',
            invoiceId: invoice.id,
            processedAt: new Date(),
          },
        });

        this.logger.log(
          `[FISCAL BATCH] Created Invoice ${invoice.id} for Operator ${operatorId}. Total: R$ ${totalAmount.toFixed(2)} (${items.length} items)`,
        );
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to process batch for Operator ${operatorId}: ${error.message}`,
      );
    }
  }
}
