import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Interfaces for JSON Configuration
export interface FeesConfig {
  rechargeFixed?: number;
  rechargePercent?: number;
  creditRiskFixed?: number;
  creditRiskPercent?: number;
  transactionPercent?: number;
  convenienceFee?: number; // Fee from Parent (e.g. 2.00)
}

export interface SplitResult {
  totalPaid: number; // What the parent pays (Credit + Convenience)
  creditAmount: number; // What goes into Wallet
  platformFee: number; // What Nodum keeps (Fixed + Percent + Risk)
  netAmount: number; // What School/Operator gets
  breakdown: {
    convenience: number;
    serviceFixed: number;
    servicePercent: number;
    riskFee: number;
  };
}

@Injectable()
export class FeeCalculatorService {
  private readonly logger = new Logger(FeeCalculatorService.name);

  // Fallback apenas se banco estiver vazio (deve ter pelo menos um registro)
  private readonly HARDCODED_FALLBACK = 2.99;

  constructor(private readonly prisma: PrismaService) {}

  private isPremium(
    user?: any,
  ): boolean {
    if (!user?.subscriptionPlanId) return false;
    if (user.subscriptionStatus !== 'ACTIVE') return false;
    if (
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt).getTime() < Date.now()
    )
      return false;
    return true;
  }

  /**
   * Calculates the split for a Recharge Transaction
   * @param amount The amount of credit the user wants (e.g. 50.00)
   * @param school The school entity (with Plan and Custom Config)
   * @param user The user performing the recharge (to check for Premium)
   * @param isRecovery Whether this is a debt recovery recharge (triggers risk fees)
   */
  async calculateRechargeSplit(
    amount: number,
    school: any,
    user?: any,
    isRecovery = false,
  ): Promise<SplitResult> {
    const creditValue = amount;

    const config = this.resolveFeesConfig(school);

    const premium = this.isPremium(user);
    let rawConvenience = 0;
    if (!premium) {
      // Buscar taxa do banco (CashInFee) - profissional, configurável sem deploy
      const cashInFee = await this.prisma.cashInFee.findFirst();
      const pixCustomerFixed = cashInFee?.pixCustomerFixed ?? this.HARDCODED_FALLBACK;
      
      // Usar configuração do School/Plan se existir, senão do CashInFee
      const configured = Number(config.convenienceFee ?? pixCustomerFixed);
      const isValidConfigured = Number.isFinite(configured) && configured >= 0;

      rawConvenience = isValidConfigured ? configured : this.HARDCODED_FALLBACK;

      if (!isValidConfigured) {
        this.logger.warn(
          `Config de taxa inválida/ausente. Usando fallback de R$${this.HARDCODED_FALLBACK.toFixed(2)}.`,
        );
      }
    }

    const convenienceFee = rawConvenience;

    // Para o piloto v2.1: a captura de valor é na entrada do recurso (convenienceFee).
    // O crédito que vai para a carteira é exatamente o valor solicitado (creditValue).
    const serviceFixed = 0;
    const servicePercent = 0;

    // Risk fee permanece desativado no piloto, mas mantemos o gancho.
    const riskFee = 0;

    const totalPaid = creditValue + convenienceFee;
    const platformFee = convenienceFee;
    const netAmount = creditValue;

    return {
      totalPaid,
      creditAmount: creditValue,
      platformFee,
      netAmount,
      breakdown: {
        convenience: convenienceFee,
        serviceFixed,
        servicePercent,
        riskFee,
      },
    };
  }

  private resolveFeesConfig(school: any): FeesConfig {
    // 1. School Override (Highest Priority)
    if (school.customFeesConfig) {
      return school.customFeesConfig as unknown as FeesConfig;
    }

    // 2. Plan Configuration
    if (school.plan.feesConfig) {
      return school.plan.feesConfig as unknown as FeesConfig;
    }

    // 3. Retornar objeto vazio - taxa virá do CashInFee do banco
    return {};
  }
}
