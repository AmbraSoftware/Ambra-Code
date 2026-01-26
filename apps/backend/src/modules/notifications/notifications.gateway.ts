/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

/**
 * NOTIFICATIONS GATEWAY v3.8.5 - MASTER INDUSTRIAL
 * Gerencia conexões em tempo real e roteamento de mensagens por Salas.
 */
@UseGuards(WsJwtGuard)
@WebSocketGateway({
  cors: {
    origin: '*', // Em produção, restrinja para o domínio do seu frontend
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  /**
   * Ao conectar, o utilizador entra automaticamente numa sala com o seu próprio ID.
   * Isso permite enviar mensagens privadas usando .to(userId).
   */
  handleConnection(client: Socket) {
    // @ts-ignore - O WsJwtGuard injeta o user no cliente
    const userId = client.user?.id;

    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      client.join(userId);
      this.logger.log(
        `⚡ Usuário ${userId} conectado e entrou na sala privada.`,
      );
    }
    this.logger.log(`Cliente conectado ao socket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('join_canteen_room')
  handleJoinRoom(
    @MessageBody('schoolId') schoolId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    if (schoolId) {
      this.logger.log(
        `Operador ${client.id} entrou na sala da escola ${schoolId}`,
      );
      client.join(schoolId);
    }
  }

  /**
   * ENVIO PRIVADO (RESOLVE O ERRO #2339)
   * Envia uma mensagem para um usuário específico através da sala privada dele.
   */
  sendToUser(userId: string, event: string, payload: any) {
    this.logger.log(`Enviando evento '${event}' para o usuário ${userId}`);
    this.server.to(userId).emit(event, payload);
  }

  /**
   * NOTIFICAÇÃO DE NOVO PEDIDO (BROADCAST PARA A CANTINA)
   */
  notifyNewOrder(schoolId: string, order: any) {
    this.logger.log(
      `Enviando notificação 'new_order' para a unidade ${schoolId}`,
    );
    this.server.to(schoolId).emit('new_order', order);
  }
}
