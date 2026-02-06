import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

// --- 1. CORE INFRASTRUCTURE MODULES ---
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
// import { QueueModule } from './modules/queue/queue.module'; // DESABILITADO: Redis atingiu limite
import { TasksModule } from './modules/tasks/tasks.module';

// --- 2. BUSINESS DOMAIN MODULES ---
// Authentication & Identity
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { SchoolAdminModule } from './modules/school-admin/school-admin.module';
import { GuardianModule } from './modules/guardian/guardian.module';
import { OperatorsModule } from './modules/operators/operators.module';

// Commercial & Financial
import { PlatformModule } from './modules/platform/platform.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { AsaasModule } from './modules/asaas/asaas.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { RiskModule } from './modules/risk/risk.module';

// Operational (Canteen & Store)
import { CanteenModule } from './modules/canteen/canteen.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StockModule } from './modules/stock/stock.module';
import { StoreModule } from './modules/store/store.module';

// Features & Integrations
import { AiModule } from './modules/ai/ai.module';
import { ImportModule } from './modules/import/import.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AnnouncementsModule } from './modules/communication/announcements/announcements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './modules/seed/seed.module';

// --- 3. MIDDLEWARE & GUARDS ---
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';

/**
 * APP MODULE v4.9 - NODUM KERNEL MASTER
 * Central Hub of the Nodum Ecosystem.
 * Architecture: Modular Monolith with Multi-Tenant Isolation.
 */
@Module({
  imports: [
    // A. Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),

    // B. Base Engines
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // C. Infrastructure Layer
    PrismaModule,
    CacheModule, // Redis Cluster
    NestCacheModule.register({ isGlobal: true, ttl: 60000 }),
    HealthModule,
    AuditModule,
    MetricsModule,
    StorageModule,
    NotificationsModule,
    // QueueModule, // DESABILITADO: Redis atingiu limite (não bloqueia MVP)
    TasksModule,

    // D. Domain Layer
    AuthModule,
    UsersModule,
    TenancyModule,
    SchoolAdminModule,
    GuardianModule,
    OperatorsModule,
    PlatformModule,
    WalletModule,
    PaymentModule,
    TransactionsModule,
    AsaasModule,
    FiscalModule,
    RiskModule,
    CanteenModule,
    ProductsModule,
    OrdersModule,
    StockModule,
    StoreModule,
    AiModule,
    ImportModule,
    InvitationsModule,
    CommunicationModule,
    AnnouncementsModule,
    DashboardModule,
    SeedModule,
  ],
  providers: [
    // 1. Tenant Throttling (Rate Limit per School)
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
    // 2. Subscription Enforcement (SaaS Lock)
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule implements NestModule {
  /**
   * Middleware Configuration
   * Applies Tenant Context to all routes globally.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestContextMiddleware, TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/(.*)', method: RequestMethod.ALL },
        { path: 'asaas/webhook', method: RequestMethod.POST },
        { path: 'setup/seed', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
