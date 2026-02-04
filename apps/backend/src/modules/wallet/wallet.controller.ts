import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  Query, // ✅ Adicionado para query params
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { PrismaService } from '../../prisma/prisma.service'; // ✅ Adicionado para acesso direto ao Prisma
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { RechargeDto } from './dto/recharge.dto';
import { CashInDto } from './dto/cash-in.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

/**
 * WALLET CONTROLLER v3.8.5 - RIZO PLATFORM
 * Gerencia operações de crédito e travas de segurança (Safety Switch).
 * Este controller está sincronizado com o WalletService para suporte multi-tenant.
 */
@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService, // ✅ Injeção do Prisma
  ) {}

  @Post('recharge')
  @Roles('GUARDIAN', 'SCHOOL_ADMIN')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_RECHARGE', 'Wallet')
  @ApiOperation({
    summary: 'Adiciona saldo à carteira de um dependente ou aluno.',
  })
  @ApiResponse({ status: 200, description: 'Recarga efetuada com sucesso.' })
  async recharge(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() rechargeDto: RechargeDto,
  ) {
    // FIX: Passamos o objeto 'user' completo para que o Service valide o vínculo multi-tenant
    return this.walletService.recharge(user, rechargeDto);
  }

  @Post('cash-in')
  @Roles(
    'OPERATOR_SALES',
    'OPERATOR_MEAL',
    'SCHOOL_ADMIN',
    'SUPER_ADMIN',
  )
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_CASH_IN', 'Wallet')
  @ApiOperation({
    summary:
      'Recarga de balcão (cash-in) convertendo dinheiro em saldo na carteira.',
  })
  @ApiResponse({ status: 200, description: 'Cash-in efetuado com sucesso.' })
  async cashIn(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() cashInDto: CashInDto,
  ) {
    return this.walletService.cashIn(user, cashInDto);
  }

  @Post('dependent/:dependentId/lock')
  @Roles('GUARDIAN', 'SCHOOL_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_LOCK', 'Wallet')
  @ApiOperation({ summary: 'Bloqueia a carteira (Safety Switch).' })
  async lockWallet(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('dependentId', new ParseUUIDPipe()) dependentId: string,
  ) {
    // FIX: toggleLock agora recebe o objeto 'user' para validação de segurança
    return this.walletService.toggleLock(user, dependentId, true);
  }

  @Post('dependent/:dependentId/unlock')
  @Roles('GUARDIAN', 'SCHOOL_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_UNLOCK', 'Wallet')
  @ApiOperation({ summary: 'Desbloqueia a carteira para compras.' })
  async unlockWallet(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('dependentId', new ParseUUIDPipe()) dependentId: string,
  ) {
    // FIX: toggleLock agora recebe o objeto 'user' para validação de segurança
    return this.walletService.toggleLock(user, dependentId, false);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulta saldo e detalhes da carteira do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Dados da carteira retornados.' })
  async getMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.walletService.getWallet(user.id);
  }

  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retorna o histórico de transações da carteira do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de transações retornada.' })
  async getTransactions(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('limit') limit?: number,
  ) {
    // ✅ Buscar wallet do usuário primeiro
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!wallet) {
      return []; // Retorna array vazio se não tiver wallet
    }

    // Buscar transações via Prisma diretamente (alinhado com tipos do Frontend)
    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id }, // ✅ Filtrar por wallet do usuário
      orderBy: { createdAt: 'desc' },
      take: limit || 10,
      select: {
        id: true,
        type: true, // CASH_IN, PURCHASE, REFUND, ADJUSTMENT
        amount: true,
        description: true,
        createdAt: true,
        status: true, // PENDING, COMPLETED, FAILED
      },
    });

    return transactions.map((t) => ({
      ...t,
      type: t.type === 'RECHARGE' ? 'CASH_IN' : t.type,
      amount: Number(t.amount),
      createdAt:
        t.createdAt instanceof Date
          ? t.createdAt.toISOString()
          : (t.createdAt as any),
    }));
  }
}
