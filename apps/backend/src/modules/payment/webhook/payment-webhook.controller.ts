import {
  Controller,
  Post,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { Public } from '../../auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('Payment Webhooks')
@Controller('payment/webhook')
export class PaymentWebhookController {
  constructor(private readonly webhookService: PaymentWebhookService) {}

  /**
   * Endpoint para receber notificações de confirmação de pagamento PIX.
   * O 'porquê': Este endpoint DEVE ser público, pois é chamado por um serviço externo
   * (o gateway de pagamento) que não possui um token de autenticação. A segurança é
   * garantida pela validação da assinatura criptográfica, não por JWT.
   */
  @Public()
  @Post('pix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recebe notificações de confirmação de pagamento PIX (Webhook).',
    description:
      'Endpoint para o gateway de pagamento (ex: Mercado Pago, Efí) notificar o sistema sobre um pagamento PIX confirmado.',
  })
  @ApiHeader({
    name: 'x-webhook-signature',
    description:
      'Assinatura HMAC-SHA256 do payload para verificação de autenticidade.',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook recebido e processado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Payload inválido ou faltando.' })
  @ApiResponse({ status: 403, description: 'Assinatura do webhook inválida.' })
  async handlePixWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Req() req: RawBodyRequest<Request>, // Requisitamos o corpo bruto (raw body) para a validação.
  ) {
    /**
     * FIX v3.8.1: Verificação de segurança para o TypeScript.
     * Garantimos que o rawBody existe antes de passar para o serviço.
     */
    if (!req.rawBody) {
      throw new BadRequestException(
        'O corpo bruto da requisição (rawBody) não foi encontrado.',
      );
    }

    if (!signature) {
      throw new BadRequestException(
        'Assinatura do webhook (x-webhook-signature) ausente.',
      );
    }

    await this.webhookService.processPixConfirmation(req.rawBody, signature);

    // Retornamos 200 OK para o gateway, confirmando o recebimento.
    return { received: true };
  }
}
