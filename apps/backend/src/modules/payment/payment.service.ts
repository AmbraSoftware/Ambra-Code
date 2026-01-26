import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { Prisma } from '@prisma/client';
import * as qrcode from 'qrcode';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera uma solicitação de recarga PIX, criando uma transação pendente e um QR Code.
   * O 'porquê': A criação de uma transação com status 'PENDING' é crucial para a reconciliação.
   * Quando o webhook do gateway de pagamento notificar a confirmação, teremos um registro
   * pré-existente para atualizar, garantindo que nenhuma recarga seja perdida ou processada
   * incorretamente. A geração do QR Code é simulada, mas em produção, se integraria
   * a um provedor de pagamentos.
   * @param guardianId O ID do responsável solicitando a recarga.
   * @param createRechargeDto Os dados da recarga (dependente e valor).
   * @returns Um objeto com o ID da transação, um QR Code em Base64 e um texto "Copia e Cola".
   * @throws {ForbiddenException} Se o aluno não for dependente do responsável.
   * @throws {NotFoundException} Se a carteira do dependente não for encontrada.
   * @throws {InternalServerErrorException} Se houver falha na geração do QR Code.
   */
  async generatePixRecharge(
    guardianId: string,
    createRechargeDto: CreateRechargeDto,
  ) {
    const { dependentId, amount } = createRechargeDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Valida o vínculo entre responsável e dependente.
      const dependent = await tx.user.findFirst({
        where: {
          id: dependentId,
          guardianRelations: { some: { guardianId: guardianId } },
        },
        select: { wallet: { select: { id: true } } },
      });

      if (!dependent) {
        throw new ForbiddenException(
          'Acesso negado. Este aluno não é seu dependente.',
        );
      }
      if (!dependent.wallet) {
        throw new NotFoundException(
          'Carteira para o dependente não encontrada.',
        );
      }

      // 2. Cria uma transação PENDENTE para rastrear a recarga.
      // 2. Cria uma transação PENDENTE para rastrear a recarga.
      const fee = new Prisma.Decimal(3.0);
      const amountDecimal = new Prisma.Decimal(amount);
      const net = amountDecimal.minus(fee);

      const pendingTransaction = await tx.transaction.create({
        data: {
          walletId: dependent.wallet.id,
          amount: amountDecimal,
          platformFee: fee, // Explicitly set to match recharge logic
          netAmount: net,
          runningBalance: 0, // Saldo só será atualizado na confirmação
          type: 'RECHARGE',
          status: 'PENDING',
          description: `Solicitação de recarga PIX de R$${amount.toFixed(2)}`,
        },
      });

      // 3. Simula a geração de um payload PIX (em um cenário real, viria do gateway).
      const pixPayload = `00020126580014br.gov.bcb.pix0136${pendingTransaction.id}520400005303986540${amount.toFixed(2)}5802BR5913CantApp Inc.6009SAO PAULO62070503***6304E2E1`;

      try {
        // 4. Gera o QR Code em Base64.
        const qrCodeBase64 = await qrcode.toDataURL(pixPayload);

        return {
          transactionId: pendingTransaction.id,
          qrCode: qrCodeBase64,
          pixCopyPaste: pixPayload,
        };
      } catch (error) {
        this.logger.error('Falha ao gerar QR Code', error.stack);
        throw new InternalServerErrorException(
          'Não foi possível gerar o QR Code para o pagamento.',
        );
      }
    });
  }
}
