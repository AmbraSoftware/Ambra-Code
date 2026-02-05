import { Controller, Get, UseGuards, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Public } from '../auth/decorators/public.decorator'; // ✅ Import do decorator

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private prisma: PrismaService,
    private redisCache: RedisCacheService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Public() // ✅ Permitir acesso sem autenticação
  @ApiOperation({ summary: 'Verifica a saúde dos serviços críticos' })
  @ApiResponse({ status: 200, description: 'Sistema operando normalmente' })
  @ApiResponse({
    status: 503,
    description: 'Um ou mais serviços críticos estão indisponíveis',
  })
  async check() {
    const baseIndicators = [
      () => this.checkDatabaseHealth(),
      () => this.checkRedisHealth(),
    ];

    if (process.env.NODE_ENV === 'test') {
      return this.health.check(baseIndicators);
    }

    return this.health.check([
      ...baseIndicators,
      () => this.checkGeminiHealth(),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  private async checkDatabaseHealth(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up' } };
    } catch (error: any) {
      return { database: { status: 'down', message: error.message } };
    }
  }

  private async checkRedisHealth(): Promise<HealthIndicatorResult> {
    try {
      await this.redisCache.get('health-check');
      return { redis: { status: 'up' } };
    } catch (error) {
      return {
        redis: { status: 'down', message: 'Redis offline ou não configurado.' },
      };
    }
  }

  private async checkGeminiHealth(): Promise<HealthIndicatorResult> {
    const isConfigured = !!process.env.API_KEY;

    if (isConfigured) {
      return { 'gemini-api': { status: 'up' } };
    }

    return {
      'gemini-api': {
        status: 'down',
        message: 'Variável API_KEY ausente no .env (necessária para Gemini AI)',
      },
    };
  }

  @Get('simulate-fail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'SIMULAÇÃO: Força um evento de falha para testar alertas.',
    description:
      'Emite um evento health.service.down para validar o recebimento no Discord/Slack.',
  })
  async simulateFail() {
    this.eventEmitter.emit('health.service.down', {
      service: 'simulation-test-db',
      timestamp: new Date(),
    });
    return {
      message: 'Evento de falha simulado enviado. Verifique o Discord.',
    };
  }

  @Get('test-sentry')
  @Public()
  @ApiOperation({
    summary: 'TESTE: Gera um erro proposital para testar Sentry',
    description: 'Este endpoint gera um erro de teste que deve aparecer no Sentry.',
  })
  @ApiResponse({ status: 500, description: 'Erro proposital gerado para teste' })
  async testSentry() {
    throw new HttpException('Test Sentry Error - This is intentional', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
