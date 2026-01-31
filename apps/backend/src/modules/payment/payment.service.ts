import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { Prisma } from '@prisma/client';
import { TransactionService } from '../transactions/transactions.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionService,
  ) { }

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
    tx: Prisma.TransactionClient,
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
      const hasGuardian = user.guardianRelations && user.guardianRelations.length > 0;

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

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
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
        select: { wallet: { select: { id: true } } },
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

      // 3. Ledger PENDING (fonte da verdade para o webhook)
      const amountDecimal = new Prisma.Decimal(amount);

      const pendingTransaction = await tx.transaction.create({
        data: {
          walletId: dependent.wallet.id,
          amount: amountDecimal,
          platformFee: new Prisma.Decimal(0),
          grossAmount: amount,
          metadata: {
            splitRule: { payer: 'CUSTOMER', fee: 0 },
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
}
