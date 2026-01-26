import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';

interface HealthStatus {
  database: boolean;
  redis: boolean;
  geminiApi: boolean;
  memory: boolean;
}

/**
 * HEALTH MONITOR SERVICE v1.0.0
 * Monitora a saúde dos serviços críticos a cada minuto.
 * Emite eventos quando detecta mudanças de status (up/down).
 *
 * O 'porquê': Permite alertas proativos antes que usuários reportem problemas.
 */
@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);
  private lastStatus: HealthStatus = {
    database: true,
    redis: true,
    geminiApi: true,
    memory: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisCache: RedisCacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async monitorHealth() {
    const currentStatus = await this.checkAllServices();
    this.detectStatusChanges(currentStatus);
    this.lastStatus = currentStatus;
  }

  private async checkAllServices(): Promise<HealthStatus> {
    const [database, redis, geminiApi, memory] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkGeminiApi(),
      this.checkMemory(),
    ]);

    return {
      database: database.status === 'fulfilled' && database.value,
      redis: redis.status === 'fulfilled' && redis.value,
      geminiApi: geminiApi.status === 'fulfilled' && geminiApi.value,
      memory: memory.status === 'fulfilled' && memory.value,
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      await this.redisCache.get('health-check');
      return true;
    } catch {
      return false;
    }
  }

  private async checkGeminiApi(): Promise<boolean> {
    return !!process.env.API_KEY;
  }

  private async checkMemory(): Promise<boolean> {
    const heapUsed = process.memoryUsage().heapUsed;
    const maxHeap = 256 * 1024 * 1024; // 256MB
    return heapUsed < maxHeap;
  }

  private detectStatusChanges(current: HealthStatus) {
    for (const [service, isUp] of Object.entries(current)) {
      const wasUp = this.lastStatus[service as keyof HealthStatus];

      if (wasUp && !isUp) {
        // Serviço caiu
        this.eventEmitter.emit('health.service.down', {
          service,
          timestamp: new Date(),
        });
        this.logger.error(`🚨 ALERTA CRÍTICO: ${service} está OFFLINE`);
      } else if (!wasUp && isUp) {
        // Serviço recuperou
        this.eventEmitter.emit('health.service.up', {
          service,
          timestamp: new Date(),
        });
        this.logger.log(`✅ RECUPERADO: ${service} está ONLINE`);
      }
    }
  }
}
