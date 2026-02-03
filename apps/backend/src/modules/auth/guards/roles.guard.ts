import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUserPayload } from '../dto/user-payload.dto';

type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'MERCHANT_ADMIN'
  | 'OPERATOR_SALES'
  | 'OPERATOR_MEAL'
  | 'GOV_ADMIN'
  | 'GUARDIAN'
  | 'STUDENT'
  | 'CONSUMER';
// Legacy
// Legacy roles removidos - usar SUPER_ADMIN, MERCHANT_ADMIN, OPERATOR_SALES, OPERATOR_MEAL

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Se nenhum perfil for exigido, permite o acesso.
    }

    const request = context.switchToHttp().getRequest();

    const user: AuthenticatedUserPayload = request.user;

    if (!user || (!user.roles && !user.role)) {
      throw new ForbiddenException('Acesso negado.');
    }

    // [v5.0] Migration Compatibility
    const userRoles = user.roles || [user.role];

    // "God Mode": Global Admin tem acesso irrestrito a todas as rotas
    if (userRoles.includes('SUPER_ADMIN' as UserRole)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}
