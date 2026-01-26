import { Controller, Get, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardService, StockAlert } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('metrics')
    @Roles(UserRole.SCHOOL_ADMIN, UserRole.CANTEEN_OPERATOR)
    @ApiOperation({ summary: 'Retorna métricas do dashboard (vendas, pedidos, alunos)' })
    async getMetrics() {
        return this.dashboardService.getMetrics();
    }

    @Get('stock-alerts')
    @Roles(UserRole.SCHOOL_ADMIN, UserRole.CANTEEN_OPERATOR)
    @ApiOperation({
        summary: '[v4.5] Alertas de ruptura de estoque',
        description: 'Retorna produtos com estoque baixo (stock <= minStockAlert) ordenados por criticidade.',
    })
    async getStockAlerts(): Promise<StockAlert[]> {
        return this.dashboardService.getStockAlerts();
    }

    @Get('sales-chart')
    @Roles(UserRole.SCHOOL_ADMIN, UserRole.CANTEEN_OPERATOR, UserRole.OPERATOR_ADMIN)
    @ApiOperation({ summary: 'Dados do gráfico de vendas' })
    @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
    async getSalesChart(
        @Request() req,
        @Query('period') period: 'day' | 'week' | 'month' = 'day'
    ) {
        return this.dashboardService.getSalesChart(req.user, period);
    }
}
