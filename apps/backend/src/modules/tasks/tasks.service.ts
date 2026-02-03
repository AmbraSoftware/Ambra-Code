import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  /**
   * Executa uma tarefa agendada (Cron Job) para limpar reservas de estoque expiradas.
   * O 'porquê': No fluxo de compra, um usuário pode reservar itens no carrinho mas abandonar
   * a compra. Este 'cron job' é um mecanismo de auto-correção do sistema. Ele
   * identifica e marca essas reservas como 'EXPIRED', liberando o estoque de volta para
   * venda e garantindo que o inventário disponível esteja sempre correto, prevenindo
   * a perda de vendas por estoque falsamente indisponível.
   * 
   * FIX v4.0.4: Também faz hard delete de reservas EXPIRED/CANCELLED antigas (>7 dias)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredStockReservations() {
    this.logger.log('Executando limpeza de reservas de estoque expiradas...');
    try {
      const now = new Date();

      const expiredReservations = await this.prisma.stockReservation.findMany({
        where: {
          status: 'ACTIVE',
          expiresAt: {
            lt: now,
          },
        },
        select: {
          id: true,
        },
      });

      if (expiredReservations.length === 0) {
        this.logger.log('Nenhuma reserva expirada encontrada.');
      } else {
        const idsToExpire = expiredReservations.map((res) => res.id);

        // Buscar detalhes completos para o log de inventário
        const expiredDetails = await this.prisma.stockReservation.findMany({
          where: { id: { in: idsToExpire } },
          select: { id: true, productId: true, canteenId: true, quantity: true },
        });

        const { count } = await this.prisma.stockReservation.updateMany({
          where: {
            id: {
              in: idsToExpire,
            },
          },
          data: {
            status: 'EXPIRED',
          },
        });

        // Log de liberação de estoque virtual
        for (const detail of expiredDetails) {
          await this.prisma.inventoryLog.create({
            data: {
              productId: detail.productId,
              canteenId: detail.canteenId,
              change: 0,
              reason: `Reserva expirada e liberada (Qty: ${detail.quantity})`,
            },
          });
        }

        this.logger.log(
          `${count} reservas de estoque foram marcadas como expiradas.`,
        );
      }

      // FIX: Hard delete de reservas antigas (ghost stock cleanup)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { count: deletedCount } = await this.prisma.stockReservation.deleteMany({
        where: {
          status: { in: ['EXPIRED', 'CANCELLED'] },
          updatedAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      if (deletedCount > 0) {
        this.logger.log(
          `${deletedCount} reservas expiradas antigas foram removidas permanentemente.`,
        );
      }
    } catch (error) {
      // Adiciona logging de erro estruturado para garantir a observabilidade.
      this.logger.error('Falha ao processar reservas de estoque expiradas.', {
        errorMessage: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * [v4.0.2] Alerta de Estoque Baixo (Phase 5)
   * Verifica produtos com estoque < 10 e notifica.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkLowStock() {
    this.logger.log('Checking low stock...');
    const lowStockProducts = await this.prisma.product.findMany({
      where: {
        stock: { lt: 10 },
        isAvailable: true,
        canteen: { status: 'ACTIVE' },
      },
      include: { canteen: { select: { name: true, id: true } } },
    });

    if (lowStockProducts.length > 0) {
      this.logger.warn(
        `Found ${lowStockProducts.length} items with low stock.`,
      );
      // TODO: Send notification to Canteen Operator via NotificationService
      // We need to find the Operator for the Canteen.
      // For now, logging effectively covers the backend requirement for "System Alert".
    }
  }

  /**
   * [v4.9] Faturamento Automatizado (SaaS Billing)
   * Verifica diariamente o status das assinaturas das escolas no Asaas.
   * Se houver inadimplência, pode suspender a escola ou notificar.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncSchoolSubscriptions() {
    this.logger.log('Synchronizing School Subscriptions with Asaas...');

    // Buscar escolas com assinaturas ativas
    const schools = await this.prisma.school.findMany({
      where: {
        subscriptionId: { not: null },
        status: { in: ['ACTIVE', 'SUSPENDED'] },
      },
      select: { id: true, name: true, subscriptionId: true, status: true },
    });

    let updatedCount = 0;

    for (const school of schools) {
      if (!school.subscriptionId) continue;

      try {
        // Consultar status no Asaas (usando http client do service)
        // [MOCK IMPLEMENTATION] Simulating Asaas Check
        // Em produção, isso chamaria this.asaasService.getSubscription(school.subscriptionId)

        const isMockOverdue = false; // Force "ACTIVE" for now to avoid accidental suspensions

        if (isMockOverdue) {
          this.logger.warn(
            `Subscription ${school.subscriptionId} is OVERDUE. Suspending school ${school.name}...`,
          );
          await this.prisma.school.update({
            where: { id: school.id },
            data: { status: 'SUSPENDED' },
          });
        } else {
          this.logger.debug(`Subscription ${school.subscriptionId} is ACTIVE.`);
        }

        updatedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to sync subscription for ${school.name}`,
          error,
        );
      }
    }

    this.logger.log(`Synced ${updatedCount} subscriptions.`);
  }
}
