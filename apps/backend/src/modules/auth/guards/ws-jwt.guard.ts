/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

/**
 * WS JWT GUARD v3.8.3 - SEGURANÇA REAL-TIME
 * Protege a conexão via WebSockets, validando o token no handshake.
 * Anexa o payload do usuário ao socket para permitir filtragem por schoolId/userId.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private logger: Logger = new Logger(WsJwtGuard.name);

  constructor(private jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    // Extrai o token do Header de Autorização do Handshake
    const authHeader = client.handshake.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      this.logger.warn(
        `Acesso negado: Token ausente no handshake do socket ${client.id}`,
      );
      client.disconnect();
      return false;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super-secret-cantapp',
      });

      // Injetamos os dados do usuário no objeto do socket
      // Isso permite que o Gateway use client.user.schoolId para salas privadas
      client['user'] = payload;

      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      this.logger.error(
        `Falha na validação do token WS para o cliente ${client.id}`,
      );
      client.disconnect();
      return false;
    }
  }
}
