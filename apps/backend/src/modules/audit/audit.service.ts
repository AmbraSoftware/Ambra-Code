import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { requestContext } from '../../common/context/request-context';

type PrismaTransactionalClient = Prisma.TransactionClient;

interface AuditLogData {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: object;
  schoolId?: string; // Adicionado como opcional para flexibilidade
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gravação de log dentro de uma transação financeira.
   * Utiliza o schoolId do contexto se não for passado explicitamente.
   */
  async logAction(
    tx: PrismaTransactionalClient,
    data: AuditLogData,
  ): Promise<void> {
    const store = requestContext.getStore();
    const schoolId = data.schoolId || store?.schoolId;

    if (!schoolId) {
      this.logger.warn(`Tentativa de log sem schoolId: ${data.action}`);
      return;
    }

    await tx.auditLog.create({
      data: {
        schoolId, // Campo obrigatório satisfeito
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        meta: data.meta || {},
      },
    });
  }

  /**
   * Gravação de log via requisição HTTP (Interceptors/Controllers).
   */
  async logHttpAction(data: AuditLogData): Promise<void> {
    const store = requestContext.getStore();
    const schoolId = data.schoolId || store?.schoolId;

    if (!schoolId) {
      this.logger.warn(`Tentativa de log HTTP sem schoolId: ${data.action}`);
      return;
    }

    await this.prisma.auditLog.create({
      data: {
        schoolId, // Campo obrigatório satisfeito
        userId: data.userId || null,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        meta: data.meta || {},
      },
    });
  }

  /**
   * Recuperação de logs com paginação.
   * O PrismaService Middleware cuidará do isolamento se schoolId estiver no contexto.
   */
  async getLogsForSchool(paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [logs, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // [v4.1] Industrial Audit Stream
  async getGlobalRecentLogs() {
    return this.prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        school: { select: { name: true, slug: true } },
        user: { select: { email: true, name: true } },
      },
    });
  }

  /**
   * VERIFICAÇÃO DE INTEGRIDADE DA CHAIN HMAC
   * Valida se a blockchain-style chain de logs está íntegra.
   * Retorna lista de logs com problemas de integridade.
   *
   * O 'porquê': Garante que nenhum log foi adulterado ou removido.
   * Se um atacante tentar modificar um log antigo, o hash não baterá.
   * Se tentar remover um log, a chain será quebrada (previousHash não encontrado).
   */
  async verifyAuditChainIntegrity(schoolId: string): Promise<{
    isValid: boolean;
    totalLogs: number;
    invalidLogs: Array<{
      logId: string;
      reason: string;
      expectedPreviousHash: string | null;
      actualPreviousHash: string | null;
    }>;
  }> {
    const logs = await this.prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        logHash: true,
        previousHash: true,
        createdAt: true,
      },
    });

    const invalidLogs: Array<{
      logId: string;
      reason: string;
      expectedPreviousHash: string | null;
      actualPreviousHash: string | null;
    }> = [];

    let expectedPreviousHash: string | null = null;

    for (const log of logs) {
      // Verifica se previousHash bate com o hash do log anterior
      if (log.previousHash !== expectedPreviousHash) {
        invalidLogs.push({
          logId: log.id,
          reason: 'previousHash mismatch - chain quebrada',
          expectedPreviousHash,
          actualPreviousHash: log.previousHash,
        });
      }

      // Verifica se logHash existe (não deveria ser null por causa do trigger)
      if (!log.logHash) {
        invalidLogs.push({
          logId: log.id,
          reason: 'logHash ausente - trigger HMAC não executou',
          expectedPreviousHash: null,
          actualPreviousHash: null,
        });
      }

      // Atualiza o hash esperado para o próximo log
      expectedPreviousHash = log.logHash;
    }

    return {
      isValid: invalidLogs.length === 0,
      totalLogs: logs.length,
      invalidLogs,
    };
  }
}
