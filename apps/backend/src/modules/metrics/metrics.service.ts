import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * METRICS SERVICE v1.0.0
 * Coleta métricas operacionais do sistema para dashboard e monitoramento.
 *
 * Métricas coletadas:
 * - Pedidos (última hora, dia, semana)
 * - Receita (última hora, dia, semana)
 * - Usuários ativos (24h)
 * - Produtos com estoque baixo
 * - Performance do sistema (memória, CPU)
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(schoolId?: string) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const whereOrder = (date: Date) => ({
      createdAt: { gte: date },
      status: { in: ['PAID', 'DELIVERED'] },
      ...(schoolId ? { schoolId } : {}),
    });

    const whereUser = {
      ...(schoolId ? { schoolId } : {}),
      deletedAt: null,
    } as any;

    const [
      ordersLastHour,
      ordersLastDay,
      ordersLastWeek,
      revenueLastHour,
      revenueLastDay,
      revenueLastWeek,
      activeUsers24h,
      lowStockProducts,
      totalStudents,
      totalProducts,
    ] = await Promise.all([
      // Pedidos
      this.prisma.order.count({ where: whereOrder(oneHourAgo) as any }),
      this.prisma.order.count({ where: whereOrder(oneDayAgo) as any }),
      this.prisma.order.count({ where: whereOrder(oneWeekAgo) as any }),

      // Receita
      this.prisma.order.aggregate({
        where: whereOrder(oneHourAgo) as any,
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: whereOrder(oneDayAgo) as any,
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: whereOrder(oneWeekAgo) as any,
        _sum: { totalAmount: true },
      }),

      // Usuários ativos
      this.prisma.user.count({
        where: {
          lastLoginAt: { gte: oneDayAgo },
          ...whereUser,
        },
      }),

      // Produtos baixo estoque (Raw query difficult to genericize simply, using filtered count for safety now or leaving raw if global admin)
      // For simplicity/safety in this iteration, we might check if we can filter products by school via canteen connection
      // But products usually belong to a school/canteen. Let's assume global for now or skipped for school specific detailed view to avoid complex join query refactor in this step.
      // actually, let's just count products for now to avoid the raw query RLS complexity in this step
      this.prisma.product.count({
        where: {
          stock: { lte: 10 }, // Simplified Low Stock logic
          deletedAt: null,
          ...(schoolId ? { canteen: { schoolId } } : {}),
        },
      }),

      // Students
      this.prisma.user.count({
        where: {
          role: 'STUDENT',
          ...whereUser,
        },
      }),

      // Total Products
      this.prisma.product.count({
        where: {
          deletedAt: null,
          ...(schoolId ? { canteen: { schoolId } } : {}),
        },
      }),
    ]);

    const memoryUsage = process.memoryUsage();

    return {
      timestamp: now.toISOString(),
      orders: {
        lastHour: ordersLastHour,
        lastDay: ordersLastDay,
        lastWeek: ordersLastWeek,
      },
      revenue: {
        lastHour: Number(revenueLastHour._sum.totalAmount || 0),
        lastDay: Number(revenueLastDay._sum.totalAmount || 0),
        lastWeek: Number(revenueLastWeek._sum.totalAmount || 0),
      },
      users: {
        active24h: activeUsers24h,
        totalStudents,
      },
      inventory: {
        lowStock: lowStockProducts,
        totalProducts,
      },
      system: {
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memoryUsage.rss / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()),
      },
    };
  }

  async getRevenueMetrics(days: number = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Receita por dia
    const revenueByDay = await this.prisma.$queryRaw<
      Array<{
        date: Date;
        total: number;
      }>
    >`
      SELECT 
        DATE("createdAt") as date,
        SUM("totalAmount")::numeric as total
      FROM orders
      WHERE "createdAt" >= ${startDate}
      AND status IN ('PAID', 'DELIVERED')
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return {
      period: `${days} days`,
      data: revenueByDay.map((item) => ({
        date: item.date,
        total: Number(item.total),
      })),
    };
  }

  async getTopProducts(limit: number = 10) {
    const topProducts = await this.prisma.$queryRaw<
      Array<{
        product_id: string;
        product_name: string;
        total_quantity: bigint;
        total_revenue: number;
      }>
    >`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        SUM(oi.quantity)::bigint as total_quantity,
        SUM(oi.quantity * oi."unitPrice")::numeric as total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi."productId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status IN ('PAID', 'DELIVERED')
      AND o."createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT ${limit}
    `;

    return topProducts.map((item) => ({
      productId: item.product_id,
      productName: item.product_name,
      totalQuantity: Number(item.total_quantity),
      totalRevenue: Number(item.total_revenue),
    }));
  }
}
