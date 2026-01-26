import { Injectable, Logger } from '@nestjs/common';
import { Plan, School, User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
  totalPaid: Decimal;      // What the parent pays (Credit + Convenience)
  creditAmount: Decimal;   // What goes into Wallet
  platformFee: Decimal;    // What Nodum keeps (Fixed + Percent + Risk)
  netAmount: Decimal;      // What School/Operator gets
  breakdown: {
    convenience: Decimal;
    serviceFixed: Decimal;
    servicePercent: Decimal;
    riskFee: Decimal;
  };
}

@Injectable()
export class FeeCalculatorService {
  private readonly logger = new Logger(FeeCalculatorService.name);

  // Default ROI Fallback (Hardcoded Safety Net)
  private readonly DEFAULTS: FeesConfig = {
    rechargeFixed: 3.00,
    rechargePercent: 5.0, // 5%
    creditRiskFixed: 1.00,
    creditRiskPercent: 4.0, // 4%
    convenienceFee: 2.00
  };

  /**
   * Calculates the split for a Recharge Transaction
   * @param amount The amount of credit the user wants (e.g. 50.00)
   * @param school The school entity (with Plan and Custom Config)
   * @param user The user performing the recharge (to check for Premium)
   * @param isRecovery Whether this is a debt recovery recharge (triggers risk fees)
   */
  calculateRechargeSplit(
    amount: number | Decimal,
    school: School & { plan: Plan },
    user?: User,
    isRecovery = false
  ): SplitResult {
    const creditValue = new Decimal(amount);
    
    // 1. Resolve Configuration (Hierarchy: School > Plan > Defaults)
    const config = this.resolveFeesConfig(school);

    // 2. Calculate Convenience Fee (Parent)
    // If User has Premium Plan, Convenience Fee is 0
    // TODO: Check user.subscriptionStatus === 'ACTIVE'
    const isPremium = user?.subscriptionPlanId != null; 
    const convenienceFee = isPremium ? new Decimal(0) : new Decimal(config.convenienceFee ?? this.DEFAULTS.convenienceFee!);

    // 3. Calculate Service Fees (School/Manager)
    const serviceFixed = new Decimal(config.rechargeFixed ?? this.DEFAULTS.rechargeFixed!);
    const percentRate = new Decimal(config.rechargePercent ?? this.DEFAULTS.rechargePercent!).div(100);
    const servicePercent = creditValue.mul(percentRate);

    // 4. Calculate Risk Fee (If Recovery Mode)
    let riskFee = new Decimal(0);
    if (isRecovery) {
      const riskFixed = new Decimal(config.creditRiskFixed ?? this.DEFAULTS.creditRiskFixed!);
      const riskRate = new Decimal(config.creditRiskPercent ?? this.DEFAULTS.creditRiskPercent!).div(100);
      riskFee = riskFixed.add(creditValue.mul(riskRate));
    }

    // 5. Aggregation
    // Total Parent Pays = Credit + Convenience
    const totalPaid = creditValue.add(convenienceFee);

    // Total Platform Keeps = Convenience + ServiceFixed + ServicePercent + Risk
    const platformFee = convenienceFee
      .add(serviceFixed)
      .add(servicePercent)
      .add(riskFee);

    // Net for Operator = TotalPaid - PlatformFee - (Convenience is already in PlatformFee)
    // Wait! Logic Check:
    // Money Flow: Parent -> Asaas (TotalPaid) -> Split -> Nodum (PlatformFee) & Operator (Rest)
    // So Operator gets: TotalPaid - PlatformFee
    // But Operator expects: CreditValue - ServiceFees.
    // Let's verify:
    // Operator = (Credit + Conv) - (Conv + SvcFixed + SvcPerc + Risk)
    // Operator = Credit - SvcFixed - SvcPerc - Risk
    // This is correct. The operator pays the service fees from the principal.
    
    const netAmount = totalPaid.sub(platformFee);

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
