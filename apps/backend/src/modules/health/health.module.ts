import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { CacheModule } from '../../common/cache/cache.module';
import { HealthMonitorService } from './health-monitor.service';
import { AlertService } from './alert.service';

/**
 * HEALTH MODULE v3.8.24 - NODUM KERNEL MONITORING
 * Módulo completo de monitoramento de saúde com:
 * - Health Check Endpoint (Terminus)
 * - Monitoramento Proativo (Cron a cada minuto)
 * - Sistema de Alertas (Discord/Slack)
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule,
    PrismaModule,
    AiModule, // Importa para ter acesso ao AiService
    CacheModule, // Importa para ter acesso ao RedisCacheService
  ],
  controllers: [HealthController],
  providers: [HealthMonitorService, AlertService],
})
export class HealthModule {}
