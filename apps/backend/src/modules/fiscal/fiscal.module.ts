import { Module } from '@nestjs/common';
import { FiscalService } from './fiscal.service';
import { FiscalController } from './fiscal.controller';
import { PrismaService } from '../../prisma/prisma.service';

import { FiscalBatchService } from './fiscal-batch.service';

@Module({
  controllers: [FiscalController],
  providers: [FiscalService, FiscalBatchService, PrismaService],
  exports: [FiscalService, FiscalBatchService],
})
export class FiscalModule {}
