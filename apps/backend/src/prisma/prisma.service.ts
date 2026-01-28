/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { RequestContext } from '../common/context/request-context';

/**
 * PRISMA SERVICE v3.8.25 - NODUM KERNEL PERSISTENCE
 * Cérebro da Persistência: Implementa Prisma 7 com Driver Adapters e Tenancy Engine (RLS).
 * O 'porquê': O uso de Prisma Extensions garante que o isolamento por schoolId ocorra
 * na camada de dados, blindando o sistema contra falhas humanas no desenvolvimento de rotas.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('NodumPersistence'); // Contexto industrial
  private pool: Pool;

  /**
   * No Prisma 7 Extensions, o cliente estendido deve ser usado para que as
   * regras de isolamento automático (Tenancy) sejam aplicadas.
   */
  public readonly extendedClient;

  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL não configurada no ambiente.');
    }

    // Inicialização do Pool PostgreSQL com suporte a SSL (Obrigatório para Supabase/RDS)
    const poolInstance = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
    });

    // Chamada do super() para inicializar o motor original do Prisma com o adaptador PG
    super({
      adapter: new PrismaPg(poolInstance),
      log: ['warn', 'error'],
    });

    this.pool = poolInstance;

    // --- CONFIGURAÇÃO DA EXTENSÃO DE TENANCY (RLS VIRTUAL) ---
    // Esta extensão intercepta cada query e injeta filtros de segurança.
    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }: any) {
            const store = RequestContext.getStore();
            const schoolId = store?.schoolId;

            // Lista exaustiva de modelos que requerem isolamento por Escola
            const modelsWithSchoolId = [
              'Canteen',
              'Product',
              'Order',
              'AuditLog',
              'User',
              'GuardianInvitation',
              'Wallet',
              'Transaction',
              'StockReservation',
              'InventoryLog',
              'OrderItem',
              'DailySpend',
              'ProductRestriction',
              'CategoryRestriction',
            ];

            // Só injetamos o filtro se houver um schoolId no contexto e o modelo for protegido
            // Se o usuário for um SUPER_ADMIN (schoolId null), o filtro é ignorado.
            if (schoolId && modelsWithSchoolId.includes(model)) {
              // 1. Injeção no filtro WHERE (Leitura/Update/Delete)
              const needsWhere = [
                'findFirst',
                'findMany',
                'findUnique',
                'findUniqueOrThrow',
                'update',
                'updateMany',
                'delete',
                'deleteMany',
                'count',
                'aggregate',
                'groupBy',
              ];

              if (needsWhere.includes(operation)) {
                args.where = args.where || {};
                args.where.schoolId = schoolId;
              }

              // 2. Injeção no DATA (Criação de novos registros)
              if (operation === 'create' || operation === 'createMany') {
                if (args.data) {
                  if (Array.isArray(args.data)) {
                    args.data = args.data.map((item: any) => ({
                      ...item,
                      schoolId,
                    }));
                  } else {
                    args.data.schoolId = schoolId;
                  }
                }
              }
            }

            return query(args);
          },
        },
      },
    });
  }

  /**
   * Ciclo de vida: Garante que o motor Prisma 7 inicialize no arranque da aplicação.
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(
        '🚀 Motor de Persistência NODUM ligado (RLS Extensions Ativo).',
      );
    } catch (error) {
      this.logger.error('❌ Erro fatal de conexão à base de dados:', error);
      process.exit(1);
    }
  }

  /**
   * Ciclo de vida: Garante o encerramento limpo do pool de conexões.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('🔌 Conexão PostgreSQL encerrada com segurança.');
  }
}
