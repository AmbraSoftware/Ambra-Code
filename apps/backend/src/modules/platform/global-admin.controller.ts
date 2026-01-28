import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, Logger } from '@nestjs/common';
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
import { FeesService } from './fees.service';
import { CouponsService } from './coupons.service';
import { UpdateCashInFeesDto } from './dto/cash-in-fees.dto';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly feesService: FeesService,
    private readonly couponsService: CouponsService,
  ) {}

  @Get('metrics')
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista todas as verticais de negócio (Systems).' })
  async listSystems() {
    return (this.prisma as any).platformSystem.findMany({
      include: { _count: { select: { schools: true } } },
    });
  }

  // ==========================================
  // CASH-IN FEES MANAGEMENT
  // ==========================================

  @Get('cash-in-fees')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter configuração de taxas de recarga' })
  @ApiResponse({ status: 200, description: 'Taxas recuperadas com sucesso' })
  async getCashInFees() {
    this.logger.log('📊 Buscando configuração de Cash-In Fees.');
    return this.feesService.getCashInFees();
  }

  @Put('cash-in-fees')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar configuração de taxas de recarga' })
  @ApiResponse({ status: 200, description: 'Taxas atualizadas com sucesso' })
  async updateCashInFees(@Body() dto: UpdateCashInFeesDto) {
    this.logger.log('💰 Atualizando configuração de Cash-In Fees.');
    return this.feesService.updateCashInFees(dto);
  }

  @Post('cash-in-fees/calculate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Calcular taxas para uma transação simulada' })
  @ApiResponse({ status: 200, description: 'Cálculo realizado com sucesso' })
  async calculateFees(
    @Body() body: { amount: number; method: 'boleto' | 'pix' },
  ) {
    return this.feesService.calculateFeesForTransaction(body.amount, body.method);
  }

  // ==========================================
  // COUPONS MANAGEMENT
  // ==========================================

  @Get('coupons')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todos os cupons de desconto' })
  @ApiResponse({ status: 200, description: 'Cupons recuperados com sucesso' })
  async getAllCoupons() {
    this.logger.log('🎫 Listando todos os cupons.');
    return this.couponsService.findAll();
  }

  @Get('coupons/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter detalhes de um cupom específico' })
  @ApiResponse({ status: 200, description: 'Cupom recuperado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado' })
  async getCoupon(@Param('id') id: string) {
    this.logger.log(`🎫 Buscando cupom ${id}.`);
    return this.couponsService.findOne(id);
  }

  @Post('coupons')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Criar novo cupom de desconto' })
  @ApiResponse({ status: 201, description: 'Cupom criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Cupom com este código já existe' })
  async createCoupon(@Body() dto: CreateCouponDto) {
    this.logger.log(`🎫 Criando cupom: ${dto.code}`);
    return this.couponsService.create(dto);
  }

  @Put('coupons/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar cupom existente' })
  @ApiResponse({ status: 200, description: 'Cupom atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado' })
  async updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    this.logger.log(`🎫 Atualizando cupom ${id}.`);
    return this.couponsService.update(id, dto);
  }

  @Delete('coupons/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remover cupom' })
  @ApiResponse({ status: 204, description: 'Cupom removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado' })
  async deleteCoupon(@Param('id') id: string) {
    this.logger.log(`🎫 Removendo cupom ${id}.`);
    await this.couponsService.remove(id);
    return { message: 'Cupom removido com sucesso' };
  }

  @Post('coupons/validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MERCHANT_ADMIN, UserRole.GUARDIAN)
  @ApiOperation({ summary: 'Validar e aplicar cupom a uma compra' })
  @ApiResponse({ status: 200, description: 'Cupom validado e aplicado com sucesso' })
  @ApiResponse({ status: 400, description: 'Cupom inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado' })
  async validateCoupon(
    @Body() body: { code: string; amount: number; planId?: string; audience?: string },
  ) {
    this.logger.log(`🎫 Validando cupom: ${body.code}`);
    return this.couponsService.validateAndApplyCoupon(
      body.code,
      body.amount,
      body.planId,
      body.audience as any,
    );
  }
}
