import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * PRISMA EXCEPTION FILTER v3.8.1 - MASTER INDUSTRIAL
 * Ajustado para Prisma 7: Captura erros via namespace Prisma para evitar erros de importação.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno no servidor.';

    // Log detalhado para auditoria técnica (Nível 101%)
    this.logger.error(
      `Prisma Error ${exception.code}: ${exception.message}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );

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
