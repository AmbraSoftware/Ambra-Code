export interface SplitResult {
  parentTotalPaid: number; // Pai paga (Recarga + Taxa Fixa)
  ambraFee: number; // Taxa Pai + Taxa Merchant
  merchantNetAmount: number; // Recarga - Taxa Merchant
  walletCreditAmount: number; // Crédito na carteira do aluno (Recarga)
}

export class TransactionSplitter {
  /**
   * Calcula o fluxo de caixa para uma recarga HÍBRIDA (MEI + Governo).
   * 
   * Lógica de Cobrança:
   * 1. Pai paga Taxa Fixa (ex: R$ 2,99) + Valor da Recarga.
   * 2. Merchant paga taxa % (ex: 3%) sobre o valor da recarga.
   * 
   * Split:
   * - WalletAmbra recebe: Taxa do Pai + Taxa do Merchant.
   * - WalletMerchant recebe: O restante líquido.
   */
  static calculateSplit(
    requestedCredit: number,
    parentFixedFee: number = 0, // [DISABLED] Taxa Fixa zerada
    merchantPercentFee: number = 0 // [DISABLED] Taxa % zerada
  ): SplitResult {
    const credit = Number(requestedCredit);
    
    // Sem taxas: Pai paga exatamente o valor da recarga
    const parentTotalPaid = credit;
    
    // Sem taxas: Merchant não paga nada
    const merchantFeeValue = 0;
    
    // Sem taxas: Ambra não retém nada
    const ambraFee = 0;
    
    // Merchant recebe o valor integral
    const merchantNetAmount = credit;
    
    return {
      parentTotalPaid,
      ambraFee,
      merchantNetAmount,
      walletCreditAmount: credit,
    };
  }
}
