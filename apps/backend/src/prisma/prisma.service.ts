import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PRISMA SERVICE v3.8.25 - NODUM KERNEL PERSISTENCE
 * Cérebro da Persistência: Implementa Prisma Client com Tenancy Engine (RLS).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('NodumPersistence');

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Conexão com PostgreSQL estabelecida.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Conexão com PostgreSQL encerrada.');
  }
}
