import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';

export interface StockAlert {
    id: string;
    name: string;
    category: string;
    stock: number;
    minStockAlert: number;
    imageUrl: string | null;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

@Injectable()
export class DashboardService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * [v4.5] Stock Alerts - Business Intelligence
     * O 'porquê': Evita que produtos críticos acabem durante horário de pico (recreio).
     * Retorna produtos onde stock <= minStockAlert, ordenados por criticidade.
     */
    async getStockAlerts(): Promise<StockAlert[]> {
        const products = await this.prisma.product.findMany({
            where: {
                isAvailable: true, // Só alertar produtos ativos
            },
            select: {
                id: true,
                name: true,
                category: true,
                stock: true,
                minStockAlert: true,
                imageUrl: true,
            },
            orderBy: { stock: 'asc' }, // Mais críticos primeiro
        });

        // Filter and map to include severity
        return products
            .filter((p) => p.stock <= p.minStockAlert)
            .map((p) => ({
                ...p,
                severity:
                    p.stock === 0
                        ? 'CRITICAL'
                        : p.stock <= p.minStockAlert * 0.5
                            ? 'HIGH'
                            : 'MEDIUM',
            }));
    }

    /**
     * [v4.5] Dashboard Metrics
     * Retorna métricas gerais para o painel do gestor
     */
    async getMetrics() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [revenue, orders, users] = await Promise.all([
            // Revenue last 24h
            this.prisma.transaction.aggregate({
                where: {
                    createdAt: { gte: today },
                    status: 'COMPLETED',
                },
                _sum: { amount: true },
            }),

            // Orders last 24h
            this.prisma.order.count({
                where: {
                    createdAt: { gte: today },
                    status: 'DELIVERED',
                },
            }),

            // Users stats
            this.prisma.user.findMany({
                where: { role: 'STUDENT' },
                select: {
                    id: true,
                    transactions: {
                        where: { createdAt: { gte: today } },
                        select: { id: true },
                    },
                },
            }),
        ]);

        return {
            revenue: {
                lastDay: Number(revenue._sum.amount || 0),
            },
            orders: {
                lastDay: orders,
            },
            users: {
                totalStudents: users.length,
                active24h: users.filter((u) => u.transactions.length > 0).length,
            },
        };
    }

    /**
     * [v4.7] Sales Chart Data
     * Retorna dados agregados para gráficos de vendas
     */
    async getSalesChart(user: AuthenticatedUserPayload, period: 'day' | 'week' | 'month') {
        const now = new Date();
        const startDate = new Date();
        
        // Define time window
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'day':
            default:
                startDate.setHours(now.getHours() - 24);
                break;
        }

        // Context filtering
        const whereClause: any = {
            status: 'COMPLETED',
            createdAt: { gte: startDate },
        };

        if (user.schoolId) whereClause.order = { schoolId: user.schoolId };
        // if (user.canteenId) whereClause.canteenId = user.canteenId;

        const transactions = await this.prisma.transaction.findMany({
            where: whereClause,
            select: {
                amount: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Grouping Logic
        const groupedData: Record<string, number> = {};
        
        transactions.forEach(curr => {
            let timeKey: string;
            
            if (period === 'day') {
                // Group by Hour (HH:00)
                const hour = curr.createdAt.getHours();
                timeKey = `${hour}:00`;
            } else {
                // Group by Day (DD/MM)
                const day = curr.createdAt.getDate();
                const month = curr.createdAt.getMonth() + 1;
                timeKey = `${day}/${month}`;
            }

            if (!groupedData[timeKey]) groupedData[timeKey] = 0;
            groupedData[timeKey] += Number(curr.amount);
        });

        // Fill gaps? For now, just return what we have
        // But for charts it's better to sort by date if using MM/DD string
        // The object iteration order is not guaranteed, but usually follows insertion for string keys
        
        return Object.entries(groupedData).map(([name, sales]) => ({
            name,
            sales
        }));
    }
}
