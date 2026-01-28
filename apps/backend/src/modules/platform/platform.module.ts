/* eslint-disable @typescript-eslint/no-unused-vars */
import { Module, Global } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { FinanceController } from './finance.controller';
import { GlobalAdminController } from './global-admin.controller';
import { BillingService } from './billing.service';
import { HealthService } from './health.service';
import { FeesService } from './fees.service';
import { CouponsService } from './coupons.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { AsaasModule } from '../asaas/asaas.module';

/**
 * PLATFORM MODULE v3.8.5 - NODUM CONTROL PLANE
 * Centraliza a governança global, métricas e o motor de faturamento (SaaS).
 */
@Module({
  imports: [PrismaModule, AuthModule, AuditModule, AsaasModule],
  controllers: [
    PlatformController, // Gestão de Verticais (AMBRA, etc)
    GlobalAdminController, // Métoras e Dashboard Master
    FinanceController,
  ],
  providers: [PlatformService, BillingService, HealthService, FeesService, CouponsService],
  exports: [PlatformService, BillingService, HealthService, FeesService, CouponsService],
})
export class PlatformModule {}
