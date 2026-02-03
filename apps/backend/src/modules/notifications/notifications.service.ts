import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

/**
 * RIZO CORE - NOTIFICATION ENGINE v3.8.4
 * Centraliza o envio de alertas (Push, WS e futuramente WhatsApp/Email).
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: NotificationsGateway,
  ) {}

  /**
   * Envia uma notificação de compra em tempo real para o responsável.
   */
  async notifyPurchase(studentId: string, amount: number, productName: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: {
        guardianRelations: {
          include: {
            guardian: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!student) return;

    const message = `Consumo: ${student.name} acabou de comprar ${productName} (R$ ${amount.toFixed(2)}).`;

    // 1. Envio via WebSocket (Para quem está com o App aberto)
    for (const relation of student.guardianRelations) {
      if (relation.guardian) {
        this.wsGateway.sendToUser(relation.guardian.id, 'notification', {
          type: 'PURCHASE',
          title: 'Novo Consumo',
          message,
          timestamp: new Date(),
        });
      }
    }

    // 2. Log para Auditoria
    this.logger.log(
      `Notificação enviada para os responsáveis de ${student.name}`,
    );

    // TODO: Integrar com Firebase Cloud Messaging (FCM) ou WhatsApp API aqui.
  }

  /**
   * Alerta de saldo baixo.
   */
  async notifyLowBalance(userId: string, currentBalance: number) {
    if (currentBalance < 10.0) {
      this.wsGateway.sendToUser(userId, 'notification', {
        type: 'LOW_BALANCE',
        title: 'Saldo Baixo',
        message: `Atenção: O saldo da carteira está em R$ ${currentBalance.toFixed(2)}. Considere recarregar.`,
      });
    }
  }
  /**
   * Envia um broadcast para um grupo específico de utilizadores.
   * Utilizado para Campanhas (Avisos) e Comunicados Gerais.
   */
  async broadcast(
    filter: { role?: any; schoolId?: string },
    payload: { title: string; message: string; type?: string },
  ) {
    const { role, schoolId } = filter;

    // 1. Busca os destinatários no banco (para garantir que estão ativos)
    const users = await this.prisma.user.findMany({
      where: {
        role: role,
        schoolId: schoolId,
        deletedAt: null,
      },
      select: { id: true },
    });

    this.logger.log(
      `Iniciando broadcast para ${users.length} utilizadores. Filtro: ${JSON.stringify(filter)}`,
    );

    // 2. Dispara via WebSocket (Fire-and-forget para performance)
    // O Gateway gerencia quem está conectado.
    const notification = {
      type: payload.type || 'ANNOUNCEMENT',
      title: payload.title,
      message: payload.message,
      timestamp: new Date(),
    };

    // TODO: Otimizar para envio em lote se o Gateway suportar salas (rooms).
    // Por enquanto, iteramos para garantir entrega individual.
    for (const user of users) {
      this.wsGateway.sendToUser(user.id, 'notification', notification);
    }

    return { count: users.length };
  }

  /**
   * Notifica recebimento de pagamento (Phase 3: Confirmação)
   */
  async notifyPaymentReceived(userId: string, amount: number) {
    this.wsGateway.sendToUser(userId, 'notification', {
      type: 'PAYMENT_RECEIVED',
      title: 'Pagamento Recebido! 🚀',
      message: `Sua recarga de R$ ${amount.toFixed(2).replace('.', ',')} foi confirmada.`,
      timestamp: new Date(),
    });
    // Future: WhatsApp integration here
  }
  async sendSmartNotification(
    userId: string,
    payload: { title: string; message: string; type: string; urgent?: boolean },
  ) {
    // 1. Tenta envio gratuito via WebSocket (App Aberto)
    this.wsGateway.sendToUser(userId, 'notification', {
      type: payload.type,
      title: payload.title,
      message: payload.message,
      timestamp: new Date(),
    });

    // Assume success for now or implement ack.
    // In v4.1, we assume if WS gateway didn't throw, it's fine.
    // Ideally gateway should return boolean. For now, skipping "isOnline" check.

    /*
    if (isOnline) {
        this.logger.log(`[SMART NOTIFY] Delivered via WebSocket to ${userId} (Cost: R$ 0.00).`);
        return;
    }
    */

    // 2. [TODO] Tenta Push Notification (FCM/Expo) - Também Gratuito
    // const pushSuccess = await this.pushService.send(...)
    // if (pushSuccess) return;

    // 3. Fallback: Se for URGENTE e o usuário não viu, usa canal pago (WhatsApp/SMS)
    if (payload.urgent) {
      // Simulação de Custo de Envio
      this.logger.warn(
        `$$$ [COST ALERT] Sending Paid Notification (SMS/WA) to ${userId}. Reason: Urgent & Offline. $$$`,
      );
      // await this.whatsapp.send(...)
    } else {
      this.logger.log(
        `[SMART NOTIFY] Queued for inbox. User offline and not urgent.`,
      );
    }
  }
}
