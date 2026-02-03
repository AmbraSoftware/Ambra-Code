import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TransactionService } from './transactions.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { OfflineSyncService } from './offline-sync.service';
import { AuditModule } from '../audit/audit.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AsaasModule } from '../asaas/asaas.module';
import { FeeCalculatorService } from './fee-calculator.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
    EventEmitterModule.forRoot(),
    forwardRef(() => AsaasModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionService, OfflineSyncService, FeeCalculatorService, EncryptionService],
  exports: [TransactionService, FeeCalculatorService],
})
export class TransactionsModule {}
