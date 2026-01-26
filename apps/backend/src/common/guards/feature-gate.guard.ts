import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FEATURE GATE GUARD v4.1
 * Industrial Grade SaaS Permission System
 * Valida se o PLANO da Escola possui a funcionalidade requisitada ativa.
 */
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class FeatureGateGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGateGuard.name);

  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private redis: RedisCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      return true; // Rota pública ou sem restrição de feature
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.schoolId) {
      // Se não tem usuário ou escola, e a rota exige feature, bloqueia por precaução.
      // (Salvo se for Public, mas FeatureGate costuma rodar após AuthGuard)
      throw new ForbiddenException(
        'Contexto de Escola não identificado para validação de Feature.',
      );
    }

    // Busca o Plano da Escola e suas Features
    // [v4.1] Performance: Cache Layer (Redis)
    const cacheKey = `school_plan:${user.schoolId}`;
    let features = await this.redis.get<Record<string, any>>(cacheKey);

    let schoolName = 'Unknown';

    if (!features) {
      const school = await this.prisma.school.findUnique({
        where: { id: user.schoolId },
        include: {
          plan: {
            select: { features: true, name: true },
          },
        },
      });

      if (!school) {
        throw new ForbiddenException('Escola não encontrada.');
      }

      schoolName = school.name;
      features = school.plan.features as Record<string, any>;

      // Set Cache (TTL 1 hour)
      await this.redis.set(cacheKey, features, 3600);
      // this.logger.debug(`Cache Miss for ${school.name}. Fetched from DB.`);
    }

    if (!features || features[requiredFeature] !== true) {
      this.logger.warn(
        `Upgrade Required: School ${schoolName} (ID: ${user.schoolId}) tried to access ${requiredFeature} without Plan permission.`,
      );
      throw new ForbiddenException(
        `Esta funcionalidade [${requiredFeature}] requer um upgrade para o Plano ${this.getRequiredPlanName(requiredFeature)}.`,
      );
    }

    return true;
  }

  private getRequiredPlanName(feature: string): string {
    // Helper simples para mensagem de erro mais vendedora
    const map = {
      ai_reports: 'Pro ou Enterprise',
      white_label: 'Enterprise',
      inventory_advanced: 'Pro',
    };
    return map[feature] || 'Superior';
  }
}
