import { Module, forwardRef } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { AsaasWebhookService } from './asaas.webhook.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EncryptionService } from '../../common/services/encryption.service';

@Module({
  imports: [
    forwardRef(() => TransactionsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AsaasController],
  providers: [AsaasService, AsaasWebhookService, EncryptionService],
  exports: [AsaasService],
})
export class AsaasModule { }
