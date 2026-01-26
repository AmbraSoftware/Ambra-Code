import { Module } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AsaasModule } from '../asaas/asaas.module';

@Module({
  imports: [PrismaModule, AsaasModule],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
