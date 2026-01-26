import { Module, forwardRef } from '@nestjs/common';
import { AsaasService } from './asaas.service';
import { AsaasController } from './asaas.controller';
import { AsaasWebhookService } from './asaas.webhook.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => TransactionsModule),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [AsaasController],
  providers: [AsaasService, AsaasWebhookService],
  exports: [AsaasService],
})
export class AsaasModule {}
