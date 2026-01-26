import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { StockModule } from '../stock/stock.module';
import { AsaasModule } from '../asaas/asaas.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, StockModule, AsaasModule],
  providers: [TasksService],
})
export class TasksModule {}
