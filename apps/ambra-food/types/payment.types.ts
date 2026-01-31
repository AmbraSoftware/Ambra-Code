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
export type RechargeFees =
  | number
  | {
      total?: number;
      [key: string]: unknown;
    };

export interface PixRechargeResponse {
  transactionId: string;
  qrCode: string;        // Base64 do QR Code para exibir
  pixCode?: string;      // Código PIX (alguns backends retornam separado)
  pixCopyPaste: string;  // Payload PIX para copiar/colar
  totalAmount?: number;  // Total pago (crédito + taxas)
  grossAmount?: number;  // Alias do total pago (fonte da verdade do backend)
  fees?: RechargeFees;   // Taxas (number ou objeto, dependendo do backend)
  netAmount?: number;    // Valor líquido que vira crédito (pode ser calculado)
  expiresAt?: string;    // ISO string de expiração da cobrança (quando disponível)
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
