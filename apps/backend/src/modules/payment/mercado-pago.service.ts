/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MercadoPagoConfig, Payment } from 'mercadopago';

/**
 * MERCADO PAGO SERVICE v3.8.3 - TENANT AWARE
 * Este serviço agora é capaz de instanciar o cliente do Mercado Pago
 * dinamicamente usando as chaves de cada escola.
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  /**
   * Cria uma instância temporária do cliente MP para uma operação específica.
   * Se a escola não tiver chaves próprias, usa a chave global do .env.
   */
  private getClient(schoolConfig?: any): MercadoPagoConfig {
    const accessToken =
      schoolConfig?.payment?.accessToken || process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new InternalServerErrorException(
        'Configuração de pagamento ausente.',
      );
    }

    return new MercadoPagoConfig({
      accessToken: accessToken,
      options: { timeout: 7000 },
    });
  }

  async createPixPreference(
    amount: number,
    email: string,
    transactionId: string,
    schoolConfig?: any,
  ) {
    const client = this.getClient(schoolConfig);
    const payment = new Payment(client);

    try {
      const body = {
        transaction_amount: amount,
        description: `Recarga CantApp - Ref: ${transactionId}`,
        payment_method_id: 'pix',
        payer: { email },
        notification_url: `${process.env.BACKEND_URL}/payment/webhook/pix`,
        external_reference: transactionId,
      };

      const result = await payment.create({ body });

      // Garante que o objeto com os dados do PIX existe antes de acessá-lo.
      const poi = result.point_of_interaction;
      if (!poi?.transaction_data) {
        this.logger.error(
          'Resposta inválida do MP, sem dados de QR Code.',
          result,
        );
        throw new InternalServerErrorException(
          'A resposta do provedor de pagamento não incluiu os dados do QR Code.',
        );
      }

      return {
        mpId: result.id,
        qrCode: poi.transaction_data.qr_code,
        qrCodeBase64: poi.transaction_data.qr_code_base64,
        status: result.status,
      };
    } catch (error) {
      this.logger.error(`Erro MP: ${error.message}`);
      throw new InternalServerErrorException(
        'Falha ao gerar PIX com o provedor da escola.',
      );
    }
  }
}
