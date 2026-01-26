import { Module } from '@nestjs/common';
import { CanteenService } from './canteen.service';
import { CanteenController } from './canteen.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { StockModule } from '../stock/stock.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, StockModule, AuthModule],
  controllers: [CanteenController],
  providers: [CanteenService],
})
export class CanteenModule {}
