import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserPayload } from '../dto/user-payload.dto';

/**
 * Decorator de parâmetro que extrai o objeto 'user' do request.
 * Este objeto foi previamente validado e anexado pelo JwtStrategy.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
