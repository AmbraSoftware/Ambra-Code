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
    rechargeFixed: 0.00, // [DISABLED]
    rechargePercent: 0.0, // [DISABLED]
    creditRiskFixed: 0.00, // [DISABLED]
    creditRiskPercent: 0.0, // [DISABLED]
    convenienceFee: 0.00 // [DISABLED]
  };

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
    
    // [DISABLED] All fees are zeroed out as per business requirement
    const config = this.DEFAULTS; 

    // 2. Calculate Convenience Fee (Parent)
    const convenienceFee = new Prisma.Decimal(0);

    // 3. Calculate Service Fees (School/Manager)
    const serviceFixed = new Prisma.Decimal(0);
    const servicePercent = new Prisma.Decimal(0);

    // 4. Calculate Risk Fee (If Recovery Mode)
    // [DISABLED] Risk Engine is off
    const riskFee = new Prisma.Decimal(0);

    // 5. Aggregation
    // Total Parent Pays = Credit (No Fees)
    const totalPaid = creditValue;

    // Total Platform Keeps = 0
    const platformFee = new Prisma.Decimal(0);

    // Net for Operator = Credit (Full Amount)
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
