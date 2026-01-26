/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { createHmac } from 'crypto';
import { Buffer } from 'buffer';

/**
 * PAYMENT WEBHOOK SERVICE v3.8.1 - MASTER INDUSTRIAL
 * Este serviço processa as confirmações de pagamento externas.
 */
@Injectable()
export class PaymentWebhookService {
  private readonly logger = new Logger(PaymentWebhookService.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {
    /**
     * FIX v3.8.1: Garantia de string para o TypeScript.
     * Atribuímos uma string vazia caso a variável de ambiente falte,
     * o que causará erro na validação da assinatura (comportamento seguro).
     */
    this.webhookSecret = process.env.PIX_WEBHOOK_SECRET || '';

    if (!this.webhookSecret) {
      this.logger.error(
        'PIX_WEBHOOK_SECRET não está configurado! A validação de webhooks irá falhar por segurança.',
      );
    }
  }

  /**
   * Processa a confirmação de um pagamento PIX recebido via webhook.
   * O 'porquê': Realiza a validação criptográfica da origem e atualiza o saldo de forma atômica.
   */
  async processPixConfirmation(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    // 1. Validação de configuração inicial
    if (!this.webhookSecret) {
      this.logger.error(
        'Tentativa de processar webhook sem PIX_WEBHOOK_SECRET configurado.',
      );
      throw new ForbiddenException(
        'Validação de Webhook não está configurada no servidor.',
      );
    }

    if (!payload || !signature) {
      throw new BadRequestException(
        'Payload ou assinatura do webhook ausentes.',
      );
    }

    // 2. Verificação Criptográfica (Anti-Spoofing)
    this.verifySignature(payload, signature);

    // 3. Parsing dos dados do Gateway
    const data = JSON.parse(payload.toString());
    const { transactionId, status } = data;

    if (!transactionId) {
      throw new BadRequestException(
        'O payload do webhook não contém um transactionId.',
      );
    }

    if (status !== 'COMPLETED') {
      this.logger.warn(
        `Webhook ignorado para transação ${transactionId}. Status recebido: ${status}.`,
      );
      return;
    }

    // 4. Execução Financeira com Isolamento Máximo
    await this.prisma.$transaction(
      async (tx) => {
        // Busca a transação pendente com os dados da carteira
        const transaction = await tx.transaction.findFirst({
          where: { id: transactionId, status: 'PENDING' },
          include: { wallet: true },
        });

        if (!transaction) {
          this.logger.warn(
            `Transação PENDENTE ${transactionId} não encontrada. Pode já ter sido processada.`,
          );
          return;
        }

        // Incrementa o saldo na Wallet (A carteira é a única fonte de verdade)
        const updatedWallet = await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        });

        // Atualiza o status da transação e registra o Ledger (Running Balance)
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            runningBalance: updatedWallet.balance,
          },
        });

        // Registro de Auditoria Forense
        await this.auditService.logAction(tx, {
          userId: transaction.wallet.userId,
          action: 'WEBHOOK_RECHARGE_CONFIRMED',
          entity: 'Transaction',
          entityId: transaction.id,
          meta: {
            amount: transaction.amount,
            newBalance: updatedWallet.balance,
          },
        });

        this.logger.log(
          `Recarga PIX confirmada. ID: ${transactionId}. Novo Saldo: ${updatedWallet.balance}`,
        );
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Valida a assinatura HMAC de um webhook.
   */
  private verifySignature(payload: Buffer, signature: string): void {
    const hmac = createHmac('sha256', this.webhookSecret);
    const computedSignature = hmac.update(payload).digest('hex');

    if (computedSignature !== signature) {
      this.logger.error(
        'Falha crítica: Assinatura do webhook inválida (Mismatch).',
      );
      throw new ForbiddenException('Assinatura do webhook inválida.');
    }
    this.logger.log('Assinatura do webhook validada com sucesso.');
  }
}
