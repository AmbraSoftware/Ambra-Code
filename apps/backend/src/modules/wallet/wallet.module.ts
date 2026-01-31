import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletsController } from './wallets.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule, TransactionsModule],
  controllers: [WalletController, WalletsController],
  providers: [WalletService],
  exports: [WalletService], // Added exports as it is good practice and might be needed
})
export class WalletModule {}
