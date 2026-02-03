import { Module } from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AsaasModule } from '../asaas/asaas.module';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [PrismaModule, AsaasModule],
  controllers: [OperatorsController],
  providers: [OperatorsService, EncryptionService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
