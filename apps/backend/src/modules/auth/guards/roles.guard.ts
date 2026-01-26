/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  | 'GLOBAL_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'CANTEEN_OPERATOR'
  | 'GUARDIAN'
  | 'STUDENT';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user: AuthenticatedUserPayload = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado.');
    }

    // "God Mode": Global Admin tem acesso irrestrito a todas as rotas
    if (user.role === 'GLOBAL_ADMIN') {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.',
      );
    }

    return true;
  }
}
