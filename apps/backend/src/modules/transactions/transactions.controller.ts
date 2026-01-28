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
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionService } from './transactions.service';
import { OfflineSyncService } from './offline-sync.service';
import { SyncBatchDto } from './dto/offline-transaction.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Assuming standard guard exists
// import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionService,
    private readonly offlineSyncService: OfflineSyncService,
  ) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sincronização offline de transações POS' })
  async syncOffline(@Body() batchDto: SyncBatchDto) {
    return this.offlineSyncService.syncBatch(batchDto.transactions);
  }

  @Post('recharge')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Realiza recarga manual de saldo (Admin).' })
  async createRecharge(@Body() body: { userId: string; amount: number }) {
    return this.transactionsService.processRecharge(body.userId, body.amount);
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
