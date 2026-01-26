import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsaasWebhookService } from './asaas.webhook.service';

@Controller('asaas')
export class AsaasController {
  private readonly logger = new Logger(AsaasController.name);

  constructor(
    private readonly webhookService: AsaasWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook')
  async handleWebhook(
    @Body() event: any,
    @Headers('asaas-access-token') token: string,
  ) {
    // 1. Security Check
    const webhookSecret = this.configService.getOrThrow<string>(
      'ASAAS_WEBHOOK_SECRET',
    );

    if (token !== webhookSecret) {
      this.logger.warn(
        `Security Alert: Invalid Webhook Token received. IP Tracking initiated.`,
      );
      throw new UnauthorizedException('Invalid Webhook Secret');
    }

    return this.webhookService.handleWebhook(event);
  }
}
