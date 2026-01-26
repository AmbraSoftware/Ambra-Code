import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as os from 'os';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    const start = Date.now();
    try {
      // Check DB Latency
      await this.prisma.$queryRaw`SELECT 1`;
      const dbLatency = Date.now() - start;

      // System Logs
      const memoryUsage = process.memoryUsage();
      const loadAvg = os.loadavg();

      return {
        status: 'OPERATIONAL',
        timestamp: new Date(),
        infra: {
          database: { status: 'UP', latencyMs: dbLatency },
          system: {
            uptime: process.uptime(),
            load: loadAvg[0], // 1 min load average
            memory: {
              heapUsedMp: Math.round(memoryUsage.heapUsed / 1024 / 1024),
              rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
            },
          },
        },
      };
    } catch (error) {
      this.logger.error('Health Check Failed', error);
      return {
        status: 'DEGRADED',
        timestamp: new Date(),
        error: 'Infrastructure Connectivity Issue',
      };
    }
  }
}
