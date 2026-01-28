/**
 * DTO para solicitar recarga
 */
export interface RechargeDto {
  dependentId: string; // ID do aluno (student) para quem está recarregando
  amount: number;      // Valor a recarregar (em reais)
}

/**
 * Resposta da solicitação de recarga PIX
 */
export interface PixRechargeResponse {
  transactionId: string;
  qrCode: string;        // Base64 do QR Code para exibir
  pixCopyPaste: string;  // Payload PIX para copiar/colar
}

/**
 * Taxas de recarga (para exibir ao usuário)
 */
export interface CashInFees {
  boleto: PaymentMethodFee;
  pix: PaymentMethodFee;
  updatedAt: Date;
}

export interface PaymentMethodFee {
  gatewayCost: number;         // Custo do gateway
  chargeCustomer: boolean;      // Cobrar do cliente?
  customerFeeFixed: number;     // Taxa fixa (R$)
  customerFeePercent: number;   // Taxa percentual (0-100)
  chargeMerchant: boolean;      // Cobrar do merchant?
  merchantFeeFixed: number;     // Taxa fixa do merchant
  merchantFeePercent: number;   // Taxa percentual do merchant
}
