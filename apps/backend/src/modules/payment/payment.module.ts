import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { PaymentWebhookController } from './webhook/payment-webhook.controller';
import { PaymentWebhookService } from './webhook/payment-webhook.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, HttpModule, AuditModule],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService, PaymentWebhookService],
})
export class PaymentModule {}
