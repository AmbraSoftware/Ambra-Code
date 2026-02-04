import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionService } from './transactions.service';
import { OfflineSyncService } from './offline-sync.service';
import { SyncBatchDto } from './dto/offline-transaction.dto';
import { CreateCashInDto } from './dto/create-cash-in.dto';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionService,
    private readonly offlineSyncService: OfflineSyncService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sincronização offline de transações POS' })
  async syncOffline(@Body() batchDto: SyncBatchDto) {
    return this.offlineSyncService.syncBatch(batchDto.transactions);
  }

  /**
   * [ADMIN/OPERATOR] Recarga de Balcão (Dinheiro Físico)
   * Permite que operadores creditem saldo manualmente quando o pagamento
   * é feito em dinheiro físico no balcão da cantina.
   * 
   * RLS: O usuário-alvo deve pertencer à mesma escola do operador/admin.
   */
  @Post('admin/cash-in')
  @UseGuards(RolesGuard)
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'OPERATOR_SALES')
  @ApiOperation({
    summary: 'Recarga de Balcão - Credita saldo manualmente (dinheiro físico).',
    description: 'Usado por operadores para creditar saldo quando o pagamento é feito em dinheiro no balcão.',
  })
  async createCashIn(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateCashInDto,
  ) {
    // Validação RLS: O usuário-alvo deve pertencer à escola do admin/operador
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { schoolId: true, name: true },
    });

    if (!targetUser) {
      throw new ForbiddenException('Usuário não encontrado.');
    }

    // SUPER_ADMIN pode recarregar qualquer um, outros só da mesma escola
    if (user.role !== 'SUPER_ADMIN' && targetUser.schoolId !== user.schoolId) {
      throw new ForbiddenException('Você só pode recarregar usuários da sua escola.');
    }

    return this.transactionsService.processCashIn({
      operatorId: user.id,
      targetUserId: dto.userId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod || 'CASH',
      notes: dto.notes,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Histórico financeiro da carteira (Extrato).' })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: 'RECHARGE' | 'PURCHASE',
    @Query('page') page: number = 1,
  ) {
    const limit = 20;
    const skip = (page - 1) * limit;

    return this.transactionsService.findAll(user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type,
      take: limit,
      skip,
    });
  }
}
