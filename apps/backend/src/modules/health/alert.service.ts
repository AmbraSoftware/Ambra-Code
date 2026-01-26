import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * ALERT SERVICE v1.0.0
 * Envia alertas quando serviços críticos ficam offline ou recuperam.
 * Suporta webhooks Discord/Slack e pode ser estendido para email, SMS, etc.
 *
 * O 'porquê': Notificação proativa permite resposta rápida a incidentes.
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly httpService: HttpService) {}

  @OnEvent('health.service.down')
  async handleServiceDown(payload: { service: string; timestamp: Date }) {
    const { service, timestamp } = payload;

    const message = {
      content: `🚨 **ALERTA CRÍTICO - Nodum Kernel**`,
      embeds: [
        {
          title: `Serviço ${service.toUpperCase()} está OFFLINE`,
          description: `O serviço ${service} parou de responder e requer atenção imediata.`,
          color: 0xff0000, // Vermelho
          timestamp: timestamp.toISOString(),
          fields: [
            { name: 'Serviço', value: service, inline: true },
            { name: 'Status', value: '🔴 OFFLINE', inline: true },
            {
              name: 'Timestamp',
              value: timestamp.toLocaleString('pt-BR'),
              inline: false,
            },
          ],
          footer: {
            text: 'Nodum Health Monitor',
          },
        },
      ],
    };

    await this.sendDiscordWebhook(message);
    // Aqui você pode adicionar outros canais: email, SMS, PagerDuty, etc.
  }

  @OnEvent('health.service.up')
  async handleServiceUp(payload: { service: string; timestamp: Date }) {
    const { service, timestamp } = payload;

    const message = {
      content: `✅ **RECUPERAÇÃO - Nodum Kernel**`,
      embeds: [
        {
          title: `Serviço ${service.toUpperCase()} está ONLINE`,
          description: `O serviço ${service} foi recuperado com sucesso.`,
          color: 0x00ff00, // Verde
          timestamp: timestamp.toISOString(),
          fields: [
            { name: 'Serviço', value: service, inline: true },
            { name: 'Status', value: '🟢 ONLINE', inline: true },
            {
              name: 'Timestamp',
              value: timestamp.toLocaleString('pt-BR'),
              inline: false,
            },
          ],
          footer: {
            text: 'Nodum Health Monitor',
          },
        },
      ],
    };

    await this.sendDiscordWebhook(message);
  }

  private async sendDiscordWebhook(message: any) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      this.logger.warn(
        '⚠️ DISCORD_WEBHOOK_URL não configurado. Alerta não enviado.',
      );
      return;
    }

    try {
      await firstValueFrom(this.httpService.post(webhookUrl, message));
      this.logger.log('📨 Alerta enviado para Discord com sucesso');
    } catch (error) {
      this.logger.error('❌ Erro ao enviar alerta para Discord:', error);
    }
  }
}
