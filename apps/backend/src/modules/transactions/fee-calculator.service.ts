import { Injectable, Logger } from '@nestjs/common';
import { Plan, Prisma, School, User } from '@prisma/client';

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
  totalPaid: Prisma.Decimal;      // What the parent pays (Credit + Convenience)
  creditAmount: Prisma.Decimal;   // What goes into Wallet
  platformFee: Prisma.Decimal;    // What Nodum keeps (Fixed + Percent + Risk)
  netAmount: Prisma.Decimal;      // What School/Operator gets
  breakdown: {
    convenience: Prisma.Decimal;
    serviceFixed: Prisma.Decimal;
    servicePercent: Prisma.Decimal;
    riskFee: Prisma.Decimal;
  };
}

@Injectable()
export class FeeCalculatorService {
  private readonly logger = new Logger(FeeCalculatorService.name);

  // Default ROI Fallback (Hardcoded Safety Net)
  private readonly DEFAULTS: FeesConfig = {
    rechargeFixed: 0.0,
    rechargePercent: 0.0,
    creditRiskFixed: 0.0,
    creditRiskPercent: 0.0,
    convenienceFee: 0.0,
  };

  private isPremium(user?: Pick<User, 'subscriptionStatus' | 'subscriptionPlanId' | 'subscriptionExpiresAt'>): boolean {
    if (!user?.subscriptionPlanId) return false;
    if (user.subscriptionStatus !== 'ACTIVE') return false;
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < Date.now()) return false;
    return true;
  }

  /**
   * Calculates the split for a Recharge Transaction
   * @param amount The amount of credit the user wants (e.g. 50.00)
   * @param school The school entity (with Plan and Custom Config)
   * @param user The user performing the recharge (to check for Premium)
   * @param isRecovery Whether this is a debt recovery recharge (triggers risk fees)
   */
  calculateRechargeSplit(
    amount: number | Prisma.Decimal,
    school: School & { plan: Plan },
    user?: User,
    isRecovery = false
  ): SplitResult {
    const creditValue = new Prisma.Decimal(amount);

    const config = this.resolveFeesConfig(school);

    const premium = this.isPremium(user);
    const rawConvenience = premium ? 0 : Number(config.convenienceFee ?? config.rechargeFixed ?? 0);
    const convenienceFee = new Prisma.Decimal(rawConvenience);

    // Para o piloto v2.1: a captura de valor é na entrada do recurso (convenienceFee).
    // O crédito que vai para a carteira é exatamente o valor solicitado (creditValue).
    const serviceFixed = new Prisma.Decimal(0);
    const servicePercent = new Prisma.Decimal(0);

    // Risk fee permanece desativado no piloto, mas mantemos o gancho.
    const riskFee = isRecovery ? new Prisma.Decimal(0) : new Prisma.Decimal(0);

    const totalPaid = creditValue.plus(convenienceFee);
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
        riskFee
      }
    };
  }

  private resolveFeesConfig(school: School & { plan: Plan }): FeesConfig {
    // 1. School Override (Highest Priority)
    if (school.customFeesConfig) {
      return school.customFeesConfig as unknown as FeesConfig;
    }

    // 2. Plan Configuration
    if (school.plan.feesConfig) {
      return school.plan.feesConfig as unknown as FeesConfig;
    }

    // 3. Defaults
    return this.DEFAULTS;
  }
}
