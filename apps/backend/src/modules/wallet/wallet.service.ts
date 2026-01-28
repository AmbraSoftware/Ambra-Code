/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RechargeDto } from './dto/recharge.dto';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { UserRole, Prisma } from '@prisma/client';
import { TransactionService } from '../transactions/transactions.service';

/**
 * WALLET SERVICE v3.8.5 - MASTER INDUSTRIAL
 * Sincronizado com o WalletController para resolver erros TS2345 e TS2339.
 */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly transactionService: TransactionService, // Injeção do Service
  ) {}

  /**
   * Realiza uma recarga na carteira de um dependente.
   * RESOLVE TS2345: Aceita o objeto 'user' completo enviado pelo Controller.
   */
  async recharge(user: AuthenticatedUserPayload, rechargeDto: RechargeDto) {
    const { dependentId, amount } = rechargeDto;

    // 1. Validação de segurança Multi-tenant (Pai -> Filho ou Admin -> Escola)
    // Nota: A validação de acesso pode ocorrer fora da transação
    // ou dentro, dependendo da consistência desejada.
    // Como é leitura, pode ser antes para falhar rápido.
    await this.prisma.$transaction(async (tx) => {
      await this.validateAccess(tx, user, dependentId);
    });

    // 2. Processa a recarga via TransactionService (Centralizando a lógica financeira)
    const result = await this.transactionService.processRecharge(
      dependentId,
      amount,
    );

    // 3. Log de Auditoria
    // O TransactionService já cria o registro no Ledger. Aqui logamos a ação do usuário (Pai/Admin)
    await this.auditService.logAction(this.prisma, {
      userId: user.id,
      action: 'WALLET_RECHARGE',
      entity: 'Wallet',
      entityId: result.transactionId, // Usamos o ID da transação como referência ou buscamos a Wallet ID se necessário.
      meta: { amount, dependentId, transactionId: result.transactionId },
    });

    return {
      message: 'Recarga efetuada com sucesso.',
      newBalance: result.newBalance,
    };
  }

  /**
   * SAFETY SWITCH (Alterna o estado de bloqueio)
   * RESOLVE TS2339: Unifica as funções lock/unlock conforme esperado pelo Controller.
   */
  async toggleLock(
    user: AuthenticatedUserPayload,
    dependentId: string,
    isLocked: boolean,
  ) {
    const auditAction = isLocked ? 'WALLET_LOCKED' : 'WALLET_UNLOCKED';
    // O status canPurchaseAlone é o inverso do bloqueio (isLocked)
    const canPurchase = !isLocked;

    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Validação de vínculo parental ou administrativo
        const dependent = await tx.user.findFirst({
          where: { id: dependentId },
          select: {
            id: true,
            wallet: {
              select: {
                id: true,
                version: true,
                balance: true,
                dailySpendLimit: true,
              },
            }, // Include implicit fields needed
            guardianRelations: { where: { guardianId: user.id } },
          },
        });

        if (!dependent) throw new NotFoundException('Aluno não encontrado.');

        // Validação de acesso (Admins ou Responsável vinculado)
        const isAdmin =
          user.role === UserRole.SCHOOL_ADMIN ||
          user.role === UserRole.SUPER_ADMIN;

        const isLinkedGuardian =
          dependent.guardianRelations && dependent.guardianRelations.length > 0;

        if (!isAdmin && !isLinkedGuardian) {
          throw new ForbiddenException(
            'Acesso negado. Este aluno não está vinculado a você.',
          );
        }

        if (!dependent.wallet) {
          throw new NotFoundException(
            'Carteira para o dependente não encontrada.',
          );
        }

        // 2. Atualiza o status da carteira
        await tx.wallet.update({
          where: { id: dependent.wallet.id },
          data: { canPurchaseAlone: canPurchase },
        });

        // 3. Auditoria
        await this.auditService.logAction(tx, {
          userId: user.id,
          action: auditAction,
          entity: 'Wallet',
          entityId: dependent.wallet.id,
          meta: { dependentId },
        });

        return {
          message: `Carteira ${canPurchase ? 'desbloqueada' : 'bloqueada'} com sucesso.`,
        };
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Método privado para validar o acesso Multi-tenant em transações.
   */
  private async validateAccess(
    tx: Prisma.TransactionClient,
    user: AuthenticatedUserPayload,
    dependentId: string,
  ) {
    // 1. Administradores têm passe livre (dentro da escola via RLS)
    if (
      user.role === UserRole.SCHOOL_ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    )
      return;

    // 2. Responsáveis precisam de vínculo explícito

    const isLinked = await tx.user.findFirst({
      where: {
        id: dependentId,
        guardianRelations: { some: { guardianId: user.id } },
      },
    });

    if (!isLinked) {
      throw new ForbiddenException(
        'Acesso negado. Este aluno não é seu dependente.',
      );
    }
  }

  /**
   * Busca a carteira do usuário (Aluno ou Responsável se este tiver uma)
   */
  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        dailySpending: {
          where: { date: new Date() }, // Gasto de hoje
        },
      },
    });

    if (!wallet) {
      // Auto-provisionamento (Opcional, mas para MVP ajuda)
      // Se não existir, retornamos null ou 404. O ideal é que seja criada no cadastro do usuário.
      throw new NotFoundException('Carteira não encontrada.');
    }

    return wallet;
  }
}
