import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

/**
 * GLOBAL ADMIN CONTROLLER v3.8.28
 * Torre de Controle Soberana para monitorização de todo o ecossistema RIZO.
 */
@ApiTags('Global Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('global-admin')
export class GlobalAdminController {
  private readonly logger = new Logger(GlobalAdminController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Métricas de saúde e faturamento consolidado do ecossistema.',
  })
  @ApiResponse({ status: 200, description: 'Dados de telemetria recuperados.' })
  async getStats() {
    this.logger.log('📊 Requisição de Métricas Globais recebida.');

    const [schools, students, revenue, systems] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count({
        where: { role: UserRole.STUDENT, deletedAt: null },
      }),
      this.prisma.transaction.aggregate({
        where: { type: 'RECHARGE', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      (this.prisma as any).platformSystem.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    return {
      activeTenants: schools,
      totalStudents: students,
      processedVolume: Number(revenue._sum.amount || 0),
      activeVerticals: systems,
      platformStatus: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('systems')
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Lista todas as verticais de negócio (Systems).' })
  async listSystems() {
    return (this.prisma as any).platformSystem.findMany({
      include: { _count: { select: { schools: true } } },
    });
  }
}
