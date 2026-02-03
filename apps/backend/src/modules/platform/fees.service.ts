import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UpdateCashInFeesDto,
  CashInFeesResponseDto,
  PaymentMethodFeeDto,
} from './dto/cash-in-fees.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async getCashInFees(): Promise<CashInFeesResponseDto> {
    // Busca a configuração de taxas (deve ter apenas 1 registro)
    let fees = await this.prisma.cashInFee.findFirst();

    // Se não existir, cria com valores padrão
    if (!fees) {
      fees = await this.prisma.cashInFee.create({
        data: {
          boletoGatewayCost: 3.49,
          boletoChargeCustomer: true,
          boletoCustomerFixed: 4.0,
          boletoCustomerPercent: 0,
          boletoChargeMerchant: false,
          boletoMerchantFixed: 0,
          boletoMerchantPercent: 2.5,
          pixGatewayCost: 0.99,
          pixChargeCustomer: true,
          pixCustomerFixed: 2.0,
          pixCustomerPercent: 0,
          pixChargeMerchant: true,
          pixMerchantFixed: 0,
          pixMerchantPercent: 1.5,
        },
      });
    }

    return {
      boleto: {
        gatewayCost: fees.boletoGatewayCost,
        chargeCustomer: fees.boletoChargeCustomer,
        customerFeeFixed: fees.boletoCustomerFixed,
        customerFeePercent: fees.boletoCustomerPercent,
        chargeMerchant: fees.boletoChargeMerchant,
        merchantFeeFixed: fees.boletoMerchantFixed,
        merchantFeePercent: fees.boletoMerchantPercent,
      },
      pix: {
        gatewayCost: fees.pixGatewayCost,
        chargeCustomer: fees.pixChargeCustomer,
        customerFeeFixed: fees.pixCustomerFixed,
        customerFeePercent: fees.pixCustomerPercent,
        chargeMerchant: fees.pixChargeMerchant,
        merchantFeeFixed: fees.pixMerchantFixed,
        merchantFeePercent: fees.pixMerchantPercent,
      },
      updatedAt: fees.updatedAt,
    };
  }

  async updateCashInFees(
    dto: UpdateCashInFeesDto,
  ): Promise<CashInFeesResponseDto> {
    // Busca o registro existente
    let fees = await this.prisma.cashInFee.findFirst();

    if (!fees) {
      // Se não existir, cria
      fees = await this.prisma.cashInFee.create({
        data: {
          boletoGatewayCost: dto.boleto.gatewayCost,
          boletoChargeCustomer: dto.boleto.chargeCustomer,
          boletoCustomerFixed: dto.boleto.customerFeeFixed,
          boletoCustomerPercent: dto.boleto.customerFeePercent,
          boletoChargeMerchant: dto.boleto.chargeMerchant,
          boletoMerchantFixed: dto.boleto.merchantFeeFixed,
          boletoMerchantPercent: dto.boleto.merchantFeePercent,
          pixGatewayCost: dto.pix.gatewayCost,
          pixChargeCustomer: dto.pix.chargeCustomer,
          pixCustomerFixed: dto.pix.customerFeeFixed,
          pixCustomerPercent: dto.pix.customerFeePercent,
          pixChargeMerchant: dto.pix.chargeMerchant,
          pixMerchantFixed: dto.pix.merchantFeeFixed,
          pixMerchantPercent: dto.pix.merchantFeePercent,
        },
      });
    } else {
      // Atualiza o registro existente
      fees = await this.prisma.cashInFee.update({
        where: { id: fees.id },
        data: {
          boletoGatewayCost: dto.boleto.gatewayCost,
          boletoChargeCustomer: dto.boleto.chargeCustomer,
          boletoCustomerFixed: dto.boleto.customerFeeFixed,
          boletoCustomerPercent: dto.boleto.customerFeePercent,
          boletoChargeMerchant: dto.boleto.chargeMerchant,
          boletoMerchantFixed: dto.boleto.merchantFeeFixed,
          boletoMerchantPercent: dto.boleto.merchantFeePercent,
          pixGatewayCost: dto.pix.gatewayCost,
          pixChargeCustomer: dto.pix.chargeCustomer,
          pixCustomerFixed: dto.pix.customerFeeFixed,
          pixCustomerPercent: dto.pix.customerFeePercent,
          pixChargeMerchant: dto.pix.chargeMerchant,
          pixMerchantFixed: dto.pix.merchantFeeFixed,
          pixMerchantPercent: dto.pix.merchantFeePercent,
        },
      });
    }

    return this.getCashInFees();
  }

  /**
   * Calcula as taxas para uma transação específica
   */
  async calculateFeesForTransaction(amount: number, method: 'boleto' | 'pix') {
    const fees = await this.getCashInFees();
    const config = fees[method];

    const customerFee = config.chargeCustomer
      ? config.customerFeeFixed + (amount * config.customerFeePercent) / 100
      : 0;

    const merchantFee = config.chargeMerchant
      ? config.merchantFeeFixed + (amount * config.merchantFeePercent) / 100
      : 0;

    const totalRevenue = customerFee + merchantFee;
    const spread = totalRevenue - config.gatewayCost;

    return {
      amount,
      method,
      gatewayCost: config.gatewayCost,
      customerFee,
      merchantFee,
      totalRevenue,
      spread,
      customerPays: amount + customerFee,
      merchantReceives: amount - merchantFee, // O crédito que vai para o merchant após descontar a comissão
    };
  }
}
