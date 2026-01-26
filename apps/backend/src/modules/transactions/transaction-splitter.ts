export interface SplitResult {
  parentTotalPaid: number; // O que sai do cartão do pai
  nodumPlatformFee: number; // Lucro total da Nodum
  schoolNetAmount: number; // O que a escola recebe
  walletCreditAmount: number; // O crédito na carteira
}

export class TransactionSplitter {
  private static readonly FEE_FROM_PARENT = 2.0; // [v4.1] Padrão: 2.00
  private static readonly FEE_FROM_SCHOOL = 3.0; // [v4.1] Padrão: 3.00

  private static readonly RECOVERY_FEE_PARENT = 3.5; // [v4.3] Quitação: 3.50
  private static readonly RECOVERY_FEE_SCHOOL = 2.0; // [v4.3] Quitação: 2.00

  /**
   * Calcula o fluxo de caixa para uma recarga NORMAL.
   * No modelo de Neutralidade (v3.9.6):
   * 1. O pai escolhe um valor de saldo (ex: 50.00).
   * 2. O pai paga esse valor + conveniência (52.00).
   * 3. A Nodum retém a conveniência (2.00) + a taxa da escola (3.00) = 5.00.
   * 4. O aluno recebe o valor cheio escolhido (50.00), mas o 'net' da escola é 47.00.
   */
  static calculateNeutralitySplit(
    requestedCredit: number,
    overdraftFee: number = 0,
  ): SplitResult {
    // Garante precisão decimal
    const credit = Number(requestedCredit);

    const parentTotalPaid = credit + this.FEE_FROM_PARENT;

    // Lucro Nodum = Taxa Fixa + Taxa de Conveniência Pendente
    const nodumPlatformFee =
      this.FEE_FROM_PARENT + this.FEE_FROM_SCHOOL + overdraftFee;

    // Escola recebe = Crédito - (Taxa Fixa + Taxa Conveniência)
    const schoolNetAmount = credit - (this.FEE_FROM_SCHOOL + overdraftFee);

    return {
      parentTotalPaid,
      nodumPlatformFee,
      schoolNetAmount,
      walletCreditAmount: credit,
    };
  }

  /**
   * [v4.3] Split de Quitação de Dívida (Holy Grail)
   * Acionado quando a carteira está NEGATIVA.
   */
  static calculateRecoverySplit(requestedCredit: number): SplitResult {
    const credit = Number(requestedCredit);

    // Pai paga mais caro pelo "Socorro" (R$ 3.50 a mais que o valor do crédito)
    // OBS: Se o credit for 17.00. Total = 20.50.
    const parentTotalPaid = credit + this.RECOVERY_FEE_PARENT;

    // Nodum ganha mais no total (3.50 + 2.00 = 5.50)
    // A lógica de "Escola absorve" significa que sai do Principal.
    const nodumPlatformFee =
      this.RECOVERY_FEE_PARENT + this.RECOVERY_FEE_SCHOOL;

    // Escola recebe = Crédito - Taxa de Serviço da Escola (2.00)
    const schoolNetAmount = credit - this.RECOVERY_FEE_SCHOOL;

    return {
      parentTotalPaid,
      nodumPlatformFee,
      schoolNetAmount,
      walletCreditAmount: credit,
    };
  }
}
