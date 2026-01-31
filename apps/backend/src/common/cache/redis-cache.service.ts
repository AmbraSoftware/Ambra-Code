import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient } from 'redis';

/**
 * REDIS CACHE SERVICE v3.8.25 - NODUM KERNEL HIGH-PERFORMANCE
 * Implementa fail-safe e tuning para baixa latência (TCP NoDelay).
 */
@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('NodumCache'); // Contexto de Log Otimizado
  private client;
  private isConnected = false;

  constructor() {
    // Em testes E2E não precisamos de cache distribuído. Evita ruído no console e handles abertos.
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.warn('⚠️ REDIS_URL não configurada. Cache desativado.');
      return;
    }

    this.client = createClient({
      url: redisUrl,
      socket: {
        noDelay: true, // PERFORMANCE: Desativa algoritmo de Nagle para latência <1ms
        keepAlive: true, // Mantém conexão ativa e detecta quedas rapidamente
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            // Aumentado tolerância para 10 tentativas
            this.logger.error(
              '❌ Redis: Limite de tentativas de reconexão atingido (Critical Failure).',
            );
            this.isConnected = false;
            return false; // Para de tentar
          }
          return Math.min(retries * 50, 2000); // Backoff exponencial mais agressivo (rápido)
        },
      },
    });

    this.client.on('error', (err) => {
      // Log silencioso para não poluir o terminal se for apenas oscilação
      if (this.isConnected) {
        this.logger.error('📡 Redis: Conexão perdida.');
      }
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.logger.log('🚀 Redis Engine: Conectado com sucesso.');
      this.isConnected = true;
    });
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    if (this.client) {
      try {
        await this.client.connect();
      } catch (e) {
        this.logger.warn(
          '⚠️ Redis Offline: O sistema usará fallback para o Banco de Dados.',
        );
      }
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 600): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (e) {
      this.logger.error(`Erro ao salvar cache: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (e) {
      this.logger.error(`Erro ao deletar cache: ${key}`);
    }
  }
}
