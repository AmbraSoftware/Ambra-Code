import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { TransactionService } from '../transactions/transactions.service';
import { FeeCalculatorService } from '../transactions/fee-calculator.service';
import { RequestRefundDto } from './dto/request-refund.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionService,
    private readonly feeCalculator: FeeCalculatorService,
  ) {}

  /**
   * Valida se o usuário tem permissão para criar uma recarga.
   *
   * REGRA DE NEGÓCIO (Compliance 2026):
   * 1. GUARDIAN: Sempre permitido.
   * 2. STUDENT:
   *    - Cenário A (Autonomia): Sem responsável vinculado E 16+ anos → PERMITE
   *    - Cenário B (Permissão): Com responsável E flag canRechargeAlone=true → PERMITE
   *    - Caso contrário: BLOQUEIA
   *
   * @param userId ID do usuário solicitante
   * @param dependentId ID do dependente (pode ser o próprio usuário)
   * @throws {ForbiddenException} Se o aluno não tiver permissão
   */
  private async validateRechargeEligibility(
    tx: any,
    userId: string,
    dependentId: string,
  ) {
    // Buscar usuário com role e dados necessários
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: true,
        birthDate: true,
        wallet: {
          select: { canRechargeAlone: true },
        },
        guardianRelations: {
          select: { guardianId: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // 1. Se for GUARDIAN: Permite sempre
    if (user.roles.includes('GUARDIAN')) {
      return; // ✅ GUARDIAN sempre pode
    }

    // 2. Se for STUDENT: Validar regras
    if (user.roles.includes('STUDENT')) {
      const hasGuardian =
        user.guardianRelations && user.guardianRelations.length > 0;

      // Cenário A: Autonomia (Sem responsável E 16+ anos)
      if (!hasGuardian && user.birthDate) {
        const age = this.calculateAge(user.birthDate);
        if (age >= 16) {
          return; // ✅ Aluno autônomo 16+ anos
        }
      }

      // Cenário B: Permissão (Com responsável E flag ativada)
      if (hasGuardian && user.wallet?.canRechargeAlone === true) {
        return; // ✅ Aluno com permissão do responsável
      }

      // ❌ Nenhum cenário atendido: BLOQUEIA
      throw new ForbiddenException(
        'Aluno não autorizado a realizar recargas. Solicite permissão ao responsável ou aguarde completar 16 anos.',
      );
    }

    // 3. Outras roles (SCHOOL_ADMIN, etc): Permite
    return;
  }

  /**
   * Calcula a idade em anos a partir da data de nascimento
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Gera uma solicitação de recarga PIX, criando uma transação pendente e um QR Code.
   *
   * ATUALIZAÇÃO v4.0: Agora valida se STUDENT pode criar recargas (16+ anos OU permissão).
   *
   * @param userId O ID do usuário solicitante (GUARDIAN ou STUDENT).
   * @param createRechargeDto Os dados da recarga (dependente e valor).
   * @returns Um objeto com o ID da transação, um QR Code em Base64 e um texto "Copia e Cola".
   * @throws {ForbiddenException} Se o aluno não tiver permissão ou não for dependente do responsável.
   * @throws {NotFoundException} Se a carteira do dependente não for encontrada.
   * @throws {InternalServerErrorException} Se houver falha na geração do QR Code.
   */
  async generatePixRecharge(
    userId: string,
    createRechargeDto: CreateRechargeDto,
  ) {
    const { dependentId, amount } = createRechargeDto;

    const pendingTransactionId = await this.prisma.$transaction(async (tx) => {
      // 1. ✅ Valida se o usuário tem permissão para criar recargas
      await this.validateRechargeEligibility(tx, userId, dependentId);

      // 2. Valida o vínculo entre responsável e dependente (se aplicável)
      const dependent = await tx.user.findFirst({
        where: {
          id: dependentId,
          OR: [
            { guardianRelations: { some: { guardianId: userId } } },
            { id: userId },
          ],
        },
        select: {
          id: true,
          schoolId: true,
          wallet: { select: { id: true } },
        },
      });

      if (!dependent) {
        throw new ForbiddenException(
          'Acesso negado. Este aluno não é seu dependente.',
        );
      }
      if (!dependent.wallet) {
        throw new NotFoundException(
          'Carteira para o dependente não encontrada.',
        );
      }

      const payer = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          subscriptionPlanId: true,
          subscriptionStatus: true,
          subscriptionExpiresAt: true,
        },
      });

      if (!payer) {
        throw new NotFoundException('Pagador não encontrado.');
      }

      if (!dependent.schoolId) {
        throw new BadRequestException(
          'Aluno/dependente não está associado a uma escola.',
        );
      }

      const school = await tx.school.findUnique({
        where: { id: dependent.schoolId },
        include: { plan: true },
      });

      if (!school?.plan) {
        throw new BadRequestException(
          'Escola sem plano associado (feesConfig indisponível).',
        );
      }

      // 3. Ledger PENDING (fonte da verdade para o webhook)
      const amountDecimal = amount;

      const split = await this.feeCalculator.calculateRechargeSplit(
        amount,
        school as any,
        payer as unknown as any,
      );

      if (split.totalPaid < split.creditAmount) {
        throw new InternalServerErrorException(
          'Invariante violada: grossAmount < amount (net).',
        );
      }

      const pendingTransaction = await tx.transaction.create({
        data: {
          walletId: dependent.wallet.id,
          amount: amountDecimal,
          platformFee: split.platformFee,
          grossAmount: split.totalPaid,
          metadata: {
            splitRule: { payer: 'CUSTOMER', fee: split.platformFee },
          },
          netAmount: amountDecimal,
          runningBalance: 0,
          type: 'RECHARGE',
          status: 'PENDING',
          description: `Solicitação de recarga PIX de R$${amount.toFixed(2)}`,
        },
        select: { id: true },
      });

      return pendingTransaction.id;
    });

    try {
      const pix = await this.transactionsService.prepareRechargeFromPending(
        pendingTransactionId,
        userId,
      );

      return {
        transactionId: pendingTransactionId,
        qrCode: pix.encodedImage,
        pixCode: pix.brCode,
        pixCopyPaste: pix.brCode,
        totalAmount: pix.totalToPay,
        fees: Number((pix.totalToPay - amount).toFixed(2)),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    } catch (error: any) {
      this.logger.error('Falha ao gerar cobrança PIX (Asaas)', error?.stack);

      // Preserve original HTTP status codes for business rule failures.
      // Ex: BadRequestException("Cantina sem operador financeiro") should reach the client as 400.
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível gerar a cobrança PIX para o pagamento.',
      );
    }
  }

  /**
   * [P1] Refund Engine (MVP)
   * Cria um RefundRequest e TRAVA o saldo reembolsável via transação REFUND_LOCK.
   * O pagamento PIX de saída será feito manualmente (por enquanto).
   */
  async requestRefund(userId: string, dto: RequestRefundDto) {
    const { transactionId, pixKey, pixKeyType } = dto;

    return this.prisma.$transaction(
      async (tx: any) => {
        // 1) Carregar transação original (recarga) + wallet
        const original = await tx.transaction.findUnique({
          where: { id: transactionId },
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            walletId: true,
            grossAmount: true,
            netAmount: true,
            platformFee: true,
            wallet: {
              select: {
                id: true,
                balance: true,
                version: true,
                userId: true,
                user: { select: { schoolId: true } },
              },
            },
          },
        });

        if (!original || !original.wallet) {
          throw new NotFoundException('Transação não encontrada.');
        }

        if (original.type !== 'RECHARGE') {
          throw new BadRequestException(
            'Apenas recargas podem ser reembolsadas.',
          );
        }

        if (original.status !== 'COMPLETED') {
          throw new BadRequestException(
            'Apenas recargas concluídas podem ser reembolsadas.',
          );
        }

        // 2) AuthZ: somente dono da carteira pode solicitar (pai/aluno)
        if (original.wallet.userId !== userId) {
          throw new ForbiddenException('Acesso negado.');
        }

        // 3) Idempotência: não permitir múltiplos RefundRequests para a mesma transação
        const existing = await tx.refundRequest.findUnique({
          where: { originalTransactionId: original.id },
          select: { id: true, status: true },
        });

        if (existing) {
          throw new BadRequestException(
            'Já existe uma solicitação de reembolso para esta transação.',
          );
        }

        // 4) CDC (7 dias) + saldo fungível
        const now = new Date();
        const daysSince = Math.floor(
          (now.getTime() - original.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const withinCdc = daysSince <= 7;

        const originalNet = Number(original.netAmount);
        const originalGross = original.grossAmount
          ? Number(original.grossAmount)
          : originalNet;
        const walletBalance = Number(original.wallet.balance);

        const refundableNet = Math.max(0, Math.min(originalNet, walletBalance));
        if (refundableNet <= 0) {
          throw new BadRequestException('Saldo insuficiente para reembolso.');
        }

        const feeReversed = withinCdc && refundableNet === originalNet;
        const refundAmount = feeReversed ? originalGross : refundableNet;

        // 5) REFUND_LOCK: trava o saldo reembolsável na carteira (sempre em cima do NET)
        const lockAmount = refundableNet;
        const newBalance = walletBalance - lockAmount;

        const { count } = await tx.wallet.updateMany({
          where: { id: original.wallet.id, version: original.wallet.version },
          data: { balance: newBalance, version: { increment: 1 } },
        });

        if (count !== 1) {
          throw new InternalServerErrorException(
            'Falha de concorrência financeira.',
          );
        }

        const lockTx = await tx.transaction.create({
          data: {
            walletId: original.wallet.id,
            userId: original.wallet.userId,
            amount: -lockAmount,
            platformFee: 0,
            netAmount: -lockAmount,
            runningBalance: newBalance,
            type: 'REFUND_LOCK',
            status: 'COMPLETED',
            description: 'Refund Lock (solicitação de reembolso)',
            metadata: {
              originalTransactionId: original.id,
              refundableNet,
              withinCdc,
              feeReversed,
            },
          },
          select: { id: true },
        });

        // 6) Persistir RefundRequest (PENDING)
        const rr = await tx.refundRequest.create({
          data: {
            requesterId: userId,
            walletId: original.wallet.id,
            originalTransactionId: original.id,
            lockTransactionId: lockTx.id,
            amount: refundAmount,
            lockedAmount: lockAmount,
            feeReversed,
            pixKey,
            pixKeyType,
            status: 'PENDING',
          },
          select: {
            id: true,
            status: true,
            amount: true,
            lockedAmount: true,
            feeReversed: true,
          },
        });

        return {
          refundRequestId: rr.id,
          status: rr.status,
          amount: Number(rr.amount),
          lockedAmount: Number(rr.lockedAmount),
          feeReversed: rr.feeReversed,
        };
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
