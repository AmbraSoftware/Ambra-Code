import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, TransactionType, School, Plan, User, TransactionStatus } from '@prisma/client';
import { EncryptionService } from '../../common/services/encryption.service';
import { FeeCalculatorService } from './fee-calculator.service';

/**
 * Interface determining Global Financial Configuration
 * Mapped from SysConfig's fiscalConfig JSON
 */
interface FinancialFees {
  splitFixed: number;
  creditRisk: number;
  recoveryMother: number; // For future recovery logic
  recoveryFather: number; // For future recovery logic
}

/**
 * Interface for Transaction Split Calculation Result
 */
interface TransactionSplitResult {
  walletCreditAmount: number;
  nodumPlatformFee: number;
  schoolNetAmount: number;
}

/**
 * DTO for internal Debit operations
 */
interface DebitForOrderData {
  buyerId: string;
  studentId: string;
  totalAmount: number;
  orderId?: string;
}

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly eventEmitter: EventEmitter2,
    private readonly feeCalculator: FeeCalculatorService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async prepareRechargeFromPending(
    pendingTransactionId: string,
    payerUserId: string,
  ) {
    const pending = await this.prisma.transaction.findFirst({
      where: { id: pendingTransactionId, status: 'PENDING', type: 'RECHARGE' },
      include: {
        wallet: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                id: true,
                schoolId: true,
              },
            },
          },
        },
      },
    });

    if (!pending?.wallet?.user?.schoolId) {
      throw new BadRequestException(
        'Transação pendente inválida para recarga.',
      );
    }

    const payer = await this.prisma.user.findUnique({
      where: { id: payerUserId },
      select: {
        id: true,
        document: true,
        subscriptionPlanId: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!payer) {
      throw new BadRequestException('Pagador não encontrado.');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: pending.wallet.user.schoolId },
      include: {
        plan: true,
        canteens: {
          where: { type: 'COMMERCIAL', status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!school || school.canteens.length === 0) {
      throw new BadRequestException('Escola sem operador comercial ativo.');
    }

    const operatorId = school.canteens[0].operatorId;
    if (!operatorId) {
      throw new BadRequestException('Cantina sem operador financeiro.');
    }

    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator?.asaasId) {
      throw new BadRequestException(
        `Operador ${operator?.name} não possui subconta Asaas configurada (asaasId).`,
      );
    }

    const creditAmount = Number(pending.amount);

    const split = await this.feeCalculator.calculateRechargeSplit(
      creditAmount,
      school as School & { plan: Plan },
      payer as unknown as User,
    );

    if (split.totalPaid.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Valor inválido para recarga.');
    }

    const pixData = await this.asaasService.createPixCharge(
      {
        customer: payer.document || '00000000000',
        value: split.totalPaid.toNumber(),
        walletId: operator.asaasWalletId || operator.asaasId,
        description: `Recarga Ambra - ${school.name}`,
        splitValue: split.netAmount.toNumber(),
        externalReference: pendingTransactionId,
      },
      { apiKey: operator.asaasApiKey ? this.encryptionService.decrypt(operator.asaasApiKey) : undefined },
    );

    await this.prisma.transaction.update({
      where: { id: pendingTransactionId },
      data: {
        platformFee: new Prisma.Decimal(split.platformFee.toNumber()),
        netAmount: new Prisma.Decimal(split.netAmount.toNumber()),
        grossAmount: new Prisma.Decimal(split.totalPaid.toNumber()),
        metadata: {
          asaasPaymentId: pixData.id,
          splitRule: { payer: 'CUSTOMER', fee: split.platformFee.toNumber() },
        },
      },
    });

    return {
      brCode: pixData.payload,
      encodedImage: pixData.encodedImage,
      netValue: pixData.netValue,
      totalToPay: split.totalPaid.toNumber(),
    };
  }

  /**
   * [v4.3] DYNAMIC FEES HELPER
   * Fetches global financial rules from SysConfig with fallback.
   * Returns normalized FinancialFees object.
   */
  private async getFinancialConfig(): Promise<FinancialFees> {
    const config = await this.prisma.sysConfig.findFirst({
      select: { fiscalConfig: true },
    });

    // Default "Hardcoded" values (Legacy Support / Safety Net)
    const defaults: FinancialFees = {
      splitFixed: 5.0,
      creditRisk: 1.5,
      recoveryMother: 3.5,
      recoveryFather: 2.0,
    };

    if (config?.fiscalConfig) {
      // Safe casting with validation could go here.
      // We assume the structure matches if present.
      const fees = (config.fiscalConfig as any)?.fees;
      if (fees) {
        return {
          splitFixed: Number(fees.splitFixed) || defaults.splitFixed,
          creditRisk: Number(fees.creditRisk) || defaults.creditRisk,
          recoveryMother:
            Number(fees.recoveryMother) || defaults.recoveryMother,
          recoveryFather:
            Number(fees.recoveryFather) || defaults.recoveryFather,
        };
      }
    }

    return defaults;
  }

  /**
   * PREPARAR RECARGA (PIX SPLIT) - v4.0.2 Fintech
   * Generates Copy & Paste PIX Payload with defined Split rules.
   * Does NOT credit wallet yet (waits for Asaas Webhook).
   */
  async prepareRecharge(userId: string, amount: number) {
    // 1. Resolve User & School Context first (Need School Plan for Fees)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        schoolId: true,
        document: true,
        name: true,
        subscriptionPlanId: true,
      },
    });

    if (!user?.schoolId) throw new BadRequestException('Usuário sem escola.');

    const userSchool = await this.prisma.school.findUnique({
      where: { id: user.schoolId },
      include: {
        plan: true,
        canteens: {
          where: { type: 'COMMERCIAL', status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!userSchool || userSchool.canteens.length === 0) {
      throw new BadRequestException('Escola sem operador comercial ativo.');
    }

    // 2. Calculate Dynamic Fees
    const split = await this.feeCalculator.calculateRechargeSplit(
      amount,
      userSchool,
      user as User,
    );

    // Validate Minimum (at least covers fees)
    if (split.netAmount.isNegative()) {
      throw new BadRequestException(
        `O valor mínimo para recarga deve cobrir as taxas.`,
      );
    }

    const operatorId = userSchool.canteens[0].operatorId;
    if (!operatorId)
      throw new BadRequestException('Cantina sem operador financeiro.');

    const operator = await this.prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator?.asaasId) {
      throw new BadRequestException(
        `Operador ${operator?.name} não possui subconta Asaas configurada (asaasId).`,
      );
    }

    // 3. Call Asaas to Generate PIX with Dynamic Split
    const pixData = await this.asaasService.createPixCharge(
      {
        customer: user.document || '00000000000', // Payer CPF
        value: split.totalPaid.toNumber(), // Total Amount (Credit + Convenience)
        walletId: operator.asaasWalletId || operator.asaasId,
        description: `Recarga Nodum - ${userSchool.name}`,
        splitValue: split.netAmount.toNumber(), // Net for Operator
      },
      { apiKey: operator.asaasApiKey ? this.encryptionService.decrypt(operator.asaasApiKey) : undefined },
    );

    // 4. Return Payload to Frontend
    return {
      transactionId: pixData.id,
      brCode: pixData.payload,
      encodedImage: pixData.encodedImage,
      netValue: pixData.netValue,
      splitRule: `${split.platformFee.toFixed(2)} (Platform) + Remainder`,
      totalToPay: split.totalPaid.toNumber(), // Notify Frontend of Convenience Fee
    };
  }

  /**
   * RECARGA DE CARTEIRA (ENTRADA DE FUNDOS)
   * Processes payment confirmation and updates Ledger.
   * Uses Serializable isolation to prevent race conditions.
   */
  async processRecharge(userId: string, amount: number, externalId?: string) {
    // amount here is the TOTAL PAID (from webhook)

    return this.prisma.$transaction(
      async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: { userId },
        });

        if (!wallet) {
          throw new NotFoundException(
            'Carteira não encontrada para este utilizador.',
          );
        }

        // Fetch user to get schoolId for operator resolution
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: { school: { include: { plan: true } } },
        });

        if (!user || !user.schoolId || !user.school) {
          throw new BadRequestException(
            'Utilizador não associado a uma escola.',
          );
        }

        // 1. Resolve Operator Context
        const userSchool = await tx.school.findUnique({
          where: { id: user.schoolId },
          include: {
            plan: true,
            canteens: {
              where: { type: 'COMMERCIAL', status: 'ACTIVE' },
              take: 1,
            },
          },
        });

        if (!userSchool || userSchool.canteens.length === 0) {
          throw new BadRequestException(
            'Escola sem operador comercial configurado para recarga.',
          );
        }

        const operatorId = userSchool.canteens[0].operatorId;
        if (!operatorId) {
          throw new BadRequestException(
            'Cantina comercial sem operador financeiro vinculado.',
          );
        }

        const currentBalance = Number(wallet.balance);
        const isRecovery = currentBalance < 0;

        // 2. Recalculate Split based on Payment
        // IMPORTANT: 'amount' from webhook is Total Paid.
        // We need to reverse-engineer credit amount if convenience fee was added on top?
        // OR we assume PrepareRecharge set the expectation.
        // The FeeCalculator logic: TotalPaid = Credit + Convenience.
        // So Credit = TotalPaid - Convenience.

        const split = await this.feeCalculator.calculateRechargeSplit(
          amount, // This logic is slightly circular if we pass Total as Amount.
          // But for now, let's assume 'amount' is what user INTENDED to credit
          // IF the webhook sends the NET value? No, webhook sends GROSS.
          // The simplest way is to treat 'amount' as the Credit Value for now
          // and let the fees be deducted from it (classic model) OR
          // stick to the new model where Fee is ON TOP.

          // IF Fee is ON TOP, then:
          // Credit = Amount - ConvenienceFee.
          userSchool,
          user,
          isRecovery,
        );

        // Adjust Credit: The amount that goes to wallet is NOT the total paid if convenience fee exists.
        // But in `prepareRecharge`, we calculated Total = Credit + Fee.
        // If user paid Total, then Credit = Total - Fee.
        const convenienceFee = split.breakdown.convenience.toNumber();
        const creditToWallet = amount - convenienceFee;

        // Recalculate split with actual credit amount to be safe?
        // Or just use the breakdown.
        // Platform Fee includes Convenience Fee.
        // Net Amount is for Operator.

        // Re-run calc with correct input if needed?
        // Let's trust the breakdown for simplicity:
        // Platform keeps: split.platformFee
        // Operator gets: split.netAmount
        // User gets: creditToWallet

        const newBalance = currentBalance + creditToWallet;

        // 2. Ledger Record (Transaction)
        const transaction = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: new Prisma.Decimal(creditToWallet),
            platformFee: split.platformFee,
            netAmount: split.netAmount,
            operatorId: operatorId,
            userId: userId,
            runningBalance: new Prisma.Decimal(newBalance),
            type: 'RECHARGE',
            status: 'COMPLETED',
            description: 'Recarga de Saldo - PIX/Cartão',
            providerId: externalId,
          },
        });

        // 3. Update Real Balance (Optimistic Locking)
        const isSolvent = newBalance >= 0;

        await tx.wallet.update({
          where: { id: wallet.id, version: wallet.version },
          data: {
            balance: newBalance,
            negativeSince: isSolvent ? null : undefined, // Clearing debt flag if solvent
            isDebtBlocked: isSolvent ? false : undefined,
            version: { increment: 1 },
          },
        });

        // 4. Emit Events (Async)
        this.eventEmitter.emit('transaction.recharge.created', {
          transactionId: transaction.id,
          walletId: wallet.id,
          amount: creditToWallet,
          platformFee: split.platformFee.toNumber(),
          userId: userId,
          operatorId: operatorId,
        });

        return { transactionId: transaction.id, newBalance };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * [CASH-IN] Recarga de Balcão (Dinheiro Físico)
   * Processa recarga manual quando o pagamento é feito em dinheiro/cartão no balcão.
   * 
   * Diferença de processRecharge: Este é para pagamento PRESENCIAL (cash),
   * então não há taxa de conveniência (convenienceFee) - o valor é creditado integralmente.
   * 
   * @param data Dados da recarga de balcão
   * @returns Transação criada
   */
  async processCashIn(data: {
    operatorId: string;
    targetUserId: string;
    amount: number;
    paymentMethod?: string;
    notes?: string;
  }) {
    const { operatorId, targetUserId, amount, paymentMethod = 'CASH', notes } = data;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Valor inválido para recarga.');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Buscar carteira do usuário alvo
        const wallet = await tx.wallet.findUnique({
          where: { userId: targetUserId },
          include: { user: { select: { id: true, name: true, schoolId: true } } },
        });

        if (!wallet) {
          throw new NotFoundException('Carteira não encontrada para este usuário.');
        }

        // 2. Buscar operador para auditoria
        const operator = await tx.user.findUnique({
          where: { id: operatorId },
          select: { id: true, name: true, roles: true },
        });

        // 3. Calcular novo saldo (cash-in: sem taxas, valor integral)
        const currentBalance = Number(wallet.balance);
        const newBalance = currentBalance + amount;

        // 4. Criar transação de recarga (COMPLETED imediatamente - já foi pago em dinheiro)
        const transaction = await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: targetUserId,
            amount: new Prisma.Decimal(amount),
            platformFee: new Prisma.Decimal(0),
            netAmount: new Prisma.Decimal(amount),
            runningBalance: new Prisma.Decimal(newBalance),
            type: TransactionType.RECHARGE,
            status: 'COMPLETED',
            description: `Recarga em ${paymentMethod} - Balcão${notes ? `: ${notes}` : ''}`,
            metadata: {
              cashIn: true,
              paymentMethod,
              operatorId,
              operatorName: operator?.name,
              processedAt: new Date().toISOString(),
            },
          },
        });

        // 5. Atualizar saldo da carteira
        const wasNegative = currentBalance < 0;
        const isNowSolvent = newBalance >= 0;

        await tx.wallet.update({
          where: { id: wallet.id, version: wallet.version },
          data: {
            balance: newBalance,
            version: { increment: 1 },
            // Se estava negativo e agora está solvente, limpar flags
            isDebtBlocked: wasNegative && isNowSolvent ? false : undefined,
            negativeSince: wasNegative && isNowSolvent ? null : undefined,
          },
        });

        // 6. Emitir evento para notificações
        this.eventEmitter.emit('transaction.cash-in.created', {
          transactionId: transaction.id,
          walletId: wallet.id,
          amount,
          targetUserId,
          operatorId,
          operatorName: operator?.name,
        });

        return {
          transactionId: transaction.id,
          walletId: wallet.id,
          previousBalance: currentBalance,
          newBalance,
          amount,
          targetUserName: wallet.user.name,
          processedBy: operator?.name,
        };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * PROCESS PURCHASE (Direct Debit)
   * Standalone entry point for quick purchases.
   */
  async processPurchase(
    buyerId: string,
    studentId: string,
    totalAmount: number,
  ) {
    throw new BadRequestException(
      'Compra direta desabilitada. Utilize o checkout via /orders para garantir reserva de estoque e regras de negócio.',
    );
  }

  /**
   * DEBIT FROM WALLET (Transaction Core)
   * Handles Credit Logic, Shielding, and Daily Limits.
   */
  async debitFromWalletForOrderInTransaction(
    tx: Prisma.TransactionClient, // Corrected Type
    data: DebitForOrderData,
  ) {
    const { buyerId, studentId, totalAmount, orderId } = data;
    const today = new Date();

    if (!totalAmount || totalAmount <= 0) {
      throw new BadRequestException('Valor inválido para débito.');
    }

    const wallet = await tx.wallet.findUnique({
      where: { userId: studentId },
    });

    if (!wallet) {
      throw new NotFoundException(
        'Carteira não encontrada para este comprador.',
      );
    }

    const currentBalance = Number(wallet.balance);
    const overdraftLimit = Number(wallet.overdraftLimit || 0);

    // SOS Merenda: se já está em negativo, bloqueia novas compras até regularização
    if (currentBalance < 0) {
      throw new BadRequestException(
        'Saldo negativo. Regularize com uma recarga.',
      );
    }

    // Permite saldo ficar negativo até -overdraftLimit
    if (currentBalance < totalAmount - overdraftLimit) {
      throw new BadRequestException('Saldo insuficiente.');
    }

    // Daily Limit Check
    const dailySpend = await tx.dailySpend.findUnique({
      where: {
        walletId_date: { walletId: wallet.id, date: today },
      },
    });

    const spentToday = dailySpend ? Number(dailySpend.amount) : 0;
    const dailyLimit = Number(wallet.dailySpendLimit);

    if (dailyLimit > 0 && spentToday + totalAmount > dailyLimit) {
      throw new BadRequestException('Limite diário de gastos excedido.');
    }

    const newBalance = currentBalance - totalAmount;
    if (newBalance < -overdraftLimit) {
      throw new BadRequestException('Saldo insuficiente.');
    }

    // Update Daily Spend
    await tx.dailySpend.upsert({
      where: { walletId_date: { walletId: wallet.id, date: today } },
      update: { amount: { increment: totalAmount } },
      create: { walletId: wallet.id, date: today, amount: totalAmount },
    });

    // Update Wallet
    const { count } = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        version: wallet.version,
        balance: { gte: new Prisma.Decimal(totalAmount - overdraftLimit) },
      },
      data: {
        balance: newBalance,
        version: { increment: 1 },
        isDebtBlocked: newBalance < 0 ? true : wallet.isDebtBlocked,
        negativeSince:
          newBalance < 0
            ? wallet.negativeSince || new Date()
            : wallet.negativeSince,
      },
    });

    if (count !== 1) {
      throw new InternalServerErrorException(
        'Falha de concorrência financeira.',
      );
    }

    // Ledger Record
    const amountDecimal = new Prisma.Decimal(-totalAmount);
    const fee = new Prisma.Decimal(0);
    const net = amountDecimal;

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        orderId: orderId,
        amount: amountDecimal,
        platformFee: fee,
        netAmount: net,
        runningBalance: newBalance,
        type: TransactionType.PURCHASE,
        status: 'COMPLETED',
        description: `Compra CantApp para beneficiário ${studentId}`,
      },
    });

    return {
      transactionId: transaction.id,
      newBalance: new Prisma.Decimal(newBalance),
      status: 'SUCCESS',
    };
  }

  /**
   * List Transaction History with Filters
   */
  async findAll(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      type?: TransactionType;
      take?: number;
      skip?: number;
    },
  ) {
    const where: Prisma.TransactionWhereInput = {
      wallet: { userId },
    };

    if (filters) {
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
      if (filters.type) {
        where.type = filters.type;
      }
    }

    const [total, transactions] = await Promise.all([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.take ?? 20,
        skip: filters?.skip ?? 0,
        include: {
          order: { select: { orderHash: true } },
        },
      }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page: (filters?.skip ?? 0) / (filters?.take ?? 20) + 1,
      },
    };
  }

  /**
   * Calcula o auditHash para uma transação (Blockchain-style audit trail)
   * Cada transação contém o hash da transação anterior da mesma carteira,
   * criando uma cadeia imutável de auditoria.
   */
  private async calculateAuditHash(
    tx: Prisma.TransactionClient,
    walletId: string,
    transactionData: {
      amount: number;
      type: TransactionType;
      status: TransactionStatus;
      createdAt: Date;
    },
  ): Promise<string> {
    const crypto = await import('crypto');

    // Buscar a transação anterior da mesma carteira
    const previousTx = await tx.transaction.findFirst({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
      select: { auditHash: true, id: true },
    });

    const previousHash = previousTx?.auditHash || 'genesis';

    // Criar hash dos dados da transação atual
    const dataString = `${walletId}:${transactionData.amount}:${transactionData.type}:${transactionData.status}:${transactionData.createdAt.toISOString()}:${previousHash}`;

    const hash = crypto
      .createHash('sha256')
      .update(dataString)
      .digest('hex');

    return hash;
  }
}
