import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Inicializa o contexto para cada requisição com valores padrão.
    RequestContext.run({ schoolId: null, userId: null }, next);
  }
}
