import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';

export interface RechargeEvent {
  transactionId: string;
  walletId: string;
  amount: number; // 50.00
  platformFee: number; // 4.00 (Basis for Invoice)
  userId: string;
  operatorId?: string; // v4.0 Sovereignty Link
}

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listener: Escuta o evento 'transaction.recharge.created'
   * Ação: Cria o registro de Invoice pendente e inicia o processo de emissão.
   */
  @OnEvent('transaction.recharge.created', { async: true })
  async handleRecharge(payload: RechargeEvent) {
    this.logger.log(
      `Handling fiscal event for Transaction ${payload.transactionId}`,
    );

    try {
      // 1. Resolve o SchoolID do usuário (Necessário para RLS v3.9.4)
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { schoolId: true },
      });

      if (!user || !user.schoolId) {
        this.logger.error(
          `Cannot create invoice: User ${payload.userId} not linked to a school.`,
        );
        return; // Ou marque como ERROR
      }

      // 2. Verifica Configuração de Lote (Hardcoded para 'BATCH' na v4.1 Alpha)
      const USE_BATCH_MODE = true;

      if (USE_BATCH_MODE && payload.operatorId) {
        // [v4.1] BATCH MODE: Cria Item Pendente e NÃO gera Invoice agora.
        await this.prisma.fiscalPendingItem.create({
          data: {
            operatorId: payload.operatorId,
            transactionId: payload.transactionId,
            amount: new Prisma.Decimal(payload.platformFee),
            status: 'PENDING',
          },
        });
        this.logger.log(
          `[FISCAL] Fee accumulated for Batch Processing (Transaction ${payload.transactionId})`,
        );
      } else {
        // LEGACY / IMMEDIATE MODE
        const invoice = await this.prisma.invoice.create({
          data: {
            transactionId: payload.transactionId,
            schoolId: user.schoolId, // RLS requirement
            amount: new Prisma.Decimal(payload.platformFee), // R$ 4,00
            taxBase: new Prisma.Decimal(payload.platformFee), // Base de Cálculo Integrity
            status: 'PENDING',
            operatorId: payload.operatorId, // v4.0 Link
          },
        });
        this.logger.log(
          `Invoice ${invoice.id} created for School ${user.schoolId}. Status: PENDING.`,
        );

        // 2. Emission Strategy
        await this.emitExternalInvoice(invoice.id, payload);
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        this.logger.warn(
          `Invoice already exists for transaction ${payload.transactionId}. Skipping.`,
        );
        return;
      }
      this.logger.error(
        `Failed to create invoice: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Lista notas fiscais de uma escola (RLS)
   */
  async findAllInvoices(schoolId: string) {
    return this.prisma.invoice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit 50 for now
    });
  }

  /**
   * Emite a nota fiscal no provedor externo.
   * Suporta estratégia MOCK para desenvolvimento/bootstrap.
   */
  private async emitExternalInvoice(invoiceId: string, payload: RechargeEvent) {
    const provider = process.env.FISCAL_PROVIDER || 'MOCK'; // 'PLUGNOTAS', 'ENOTAS', 'MOCK'

    this.logger.log(`Emitting Invoice ${invoiceId} via ${provider}...`);

    if (provider === 'MOCK') {
      // Simula latência de rede
      await new Promise((resolve) => setTimeout(resolve, 500));

      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PENDING', // [FIX] Kept PENDING as waiting_external is not in schema yet
          // externalId: 'mock_' + Date.now()
        },
      });
      this.logger.log(
        `[MOCK] Invoice ${invoiceId} sent to hypothetical SEFAZ.`,
      );
      return;
    }

    // Implementation for Real Providers would go here
    this.logger.warn(`Provider ${provider} not implemented yet.`);
  }
}
