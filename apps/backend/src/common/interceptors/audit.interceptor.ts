import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { AuthenticatedUserPayload } from '../../modules/auth/dto/user-payload.dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUserPayload = request.user;

    return next.handle().pipe(
      tap(async (data) => {
        try {
          // O 'data' aqui é o corpo da resposta do controller.
          // Se a resposta contiver um ID, usamos como entityId.
          const entityId = data?.id;

          await this.auditService.logHttpAction({
            userId: user.id,
            action: auditMetadata.action,
            entity: auditMetadata.entity,
            entityId: entityId,
            meta: { path: request.path, params: request.params },
          });
        } catch (error) {
          this.logger.error(
            'Falha ao registrar log de auditoria no interceptor.',
            error.stack,
          );
        }
      }),
    );
  }
}
