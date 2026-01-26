/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { IS_PUBLIC_KEY } from '../../modules/auth/decorators/public.decorator';
import { AuthenticatedUserPayload } from '../../modules/auth/dto/user-payload.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { Observable } from 'rxjs';

type SchoolStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED';

@Injectable()
export class SubscriptionGuard extends JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(
    reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    super(reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 1. Isenta rotas públicas (como /login, /health)
    if (isPublic) {
      return true;
    }

    // 2. Garante que o usuário está autenticado antes de prosseguir
    await (super.canActivate(context) as Promise<boolean>);

    const request = context.switchToHttp().getRequest();

    const user: AuthenticatedUserPayload = request.user;
    const schoolId = request.tenant?.id;

    // 3. Isenta administradores globais e rotas não-tenant
    if (!schoolId || (user && user.role === 'GLOBAL_ADMIN')) {
      return true;
    }

    const cacheKey = `school-status:${schoolId}`;
    let status = this.cacheService.get<SchoolStatus>(cacheKey);

    if (!status) {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { status: true },
      });

      if (school) {
        status = school.status as SchoolStatus;
        this.cacheService.set(cacheKey, status, 5 * 60 * 1000);
      }
    }

    // 4. Bloqueia o acesso se a escola não estiver ativa.
    if (status !== 'ACTIVE') {
      this.logger.warn(
        `Acesso bloqueado para a escola ${schoolId} com status ${status}.`,
      );
      throw new ForbiddenException(
        'Acesso bloqueado. A assinatura da sua escola não está ativa. Entre em contato com o suporte.',
      );
    }

    return true;
  }
}
