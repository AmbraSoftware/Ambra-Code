import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CacheTTL } from '@nestjs/cache-manager'; // CacheInterceptor removed
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { MetricsService } from './metrics.service';

/**
 * METRICS CONTROLLER v1.0.0
 * Endpoints REST para métricas e dashboard administrativo.
 * Acesso restrito a GLOBAL_ADMIN e SCHOOL_ADMIN.
 */
@ApiTags('Metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(TenantCacheInterceptor) // Cache Global com Isolamento para o Controller
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('dashboard')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Retorna métricas completas para o dashboard administrativo',
    description:
      'Inclui pedidos, receita, usuários ativos, estoque e performance do sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas do dashboard retornadas com sucesso',
    schema: {
      example: {
        timestamp: '2025-12-23T14:20:00.000Z',
        orders: {
          lastHour: 15,
          lastDay: 120,
          lastWeek: 850,
        },
        revenue: {
          lastHour: 450.5,
          lastDay: 3200.75,
          lastWeek: 22500.0,
        },
        users: {
          active24h: 45,
          totalStudents: 320,
        },
        inventory: {
          lowStock: 8,
          totalProducts: 150,
        },
        system: {
          memory: {
            heapUsed: 128,
            heapTotal: 256,
            rss: 180,
            external: 12,
          },
          uptime: 3600,
        },
      },
    },
  })
  @CacheTTL(300000) // 5 Minutos de Cache (Dashboard pesado)
  async getDashboardMetrics(@CurrentUser() user: any) {
    return this.metricsService.getDashboardMetrics(user.schoolId);
  }

  @Get('revenue')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Retorna métricas de receita por dia',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Número de dias para análise (padrão: 7)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas de receita retornadas com sucesso',
  })
  async getRevenueMetrics(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.metricsService.getRevenueMetrics(days || 7);
  }

  @Get('top-products')
  @Roles(
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'OPERATOR_SALES',
    'OPERATOR_MEAL',
  )
  @ApiOperation({
    summary: 'Retorna os produtos mais vendidos (últimos 7 dias)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de produtos a retornar (padrão: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top produtos retornados com sucesso',
  })
  async getTopProducts(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.metricsService.getTopProducts(limit || 10);
  }
}
