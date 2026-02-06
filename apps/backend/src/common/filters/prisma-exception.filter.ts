import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

/**
 * PRISMA EXCEPTION FILTER v3.8.3 - SENTRY ENHANCED
 * Captura erros via namespace Prisma e reporta automaticamente ao Sentry.
 * 
 * IMPORTANTE: Este filtro IGNORA a rota /health para permitir que o health check
 * funcione corretamente sem interferência de tratamento de erros do Prisma.
 */
@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 🔥 FIX: Ignorar erros na rota /health para não quebrar o health check
    if (request.url === '/health' || request.url.startsWith('/health/')) {
      this.logger.warn(`Ignorando erro em ${request.url} para permitir health check: ${exception.message}`);
      // Deixar o erro ser tratado pelo NestJS default ou pelo controller
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno no servidor.';

    // Log detalhado para auditoria técnica (Nível 101%)
    this.logger.error(
      `Prisma Error ${exception.code}: ${exception.message}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );

    // Report error to Sentry with context
    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'prisma');
        scope.setTag('prisma_code', exception.code || 'unknown');
        scope.setTag('http_method', request.method);
        scope.setTag('url', request.url);
        scope.setContext('request', {
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body,
        });
        scope.setContext('error', {
          code: exception.code,
          message: exception.message,
          stack: exception.stack,
        });
        Sentry.captureException(exception);
      });
    }

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message =
          'O registro já existe. Um campo que deveria ser único (como e-mail ou CNPJ) está duplicado.';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message =
          'O registro que você tentou acessar ou modificar não foi encontrado no sistema.';
        break;
      default:
        status = HttpStatus.BAD_REQUEST;
        message =
          'Ocorreu um erro de integridade ao processar sua solicitação no banco de dados.';
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorCode: exception.code, // Útil para o frontend tratar erros específicos
    });
  }
}
