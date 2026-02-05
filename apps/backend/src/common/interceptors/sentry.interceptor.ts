import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

/**
 * SENTRY INTERCEPTOR v1.1 - TENANT CONTEXT ENHANCED
 * Captura automaticamente o contexto de tenant em todas as requisições
 * e adiciona tags/contexto ao Sentry para debugging multi-tenant.
 * 
 * Compatível com Sentry SDK v8+ (usa getCurrentScope() ao invés de configureScope())
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extrair informações de tenant do contexto da requisição
    const tenantId = request.tenantId || request.headers['x-tenant-id'] || 'unknown';
    const schoolId = request.schoolId || request.headers['x-school-id'] || 'unknown';
    const userId = request.user?.id || request.headers['x-user-id'] || 'anonymous';
    const userRole = request.user?.role || request.headers['x-user-role'] || 'unknown';

    // Configurar o escopo do Sentry com o contexto da requisição (SDK v8+ API)
    const scope = Sentry.getCurrentScope();
    
    // Tags para busca rápida no Sentry
    scope.setTag('tenant_id', String(tenantId));
    scope.setTag('school_id', String(schoolId));
    scope.setTag('user_id', String(userId));
    scope.setTag('user_role', String(userRole));
    scope.setTag('controller', context.getClass().name);
    scope.setTag('handler', context.getHandler().name);

    // Contexto rico para debugging
    scope.setContext('tenant', {
      id: tenantId,
      schoolId: schoolId,
    });
    
    scope.setContext('user', {
      id: userId,
      role: userRole,
    });

    scope.setContext('request', {
      method: request.method,
      url: request.url,
      path: request.route?.path,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        error: (error) => {
          // Erros já serão capturados pelo Sentry global,
          // mas adicionamos contexto extra se necessário
          const errorScope = Sentry.getCurrentScope();
          errorScope.setContext('error_details', {
            message: error.message,
            code: error.code,
            statusCode: error.status,
          });
        },
      }),
    );
  }
}
