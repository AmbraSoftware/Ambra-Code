import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface RiskAnalysisResult {
  score: number; // 0-1000
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dataSource: 'INTERNAL_HISTORY' | 'SERASA_MOCK';
  details: string[];
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the Credit Score based on internal ecosystem behavior.
   * This is the "Shield": We only pay for external Serasa checks if this score is ambiguous.
   */
  async calculateInternalScore(userId: string): Promise<RiskAnalysisResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    let score = 500; // Base Score
    const details: string[] = [];

    // 1. Tenure (Tiempo de Casa)
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(user.createdAt).getTime()) /
        (1000 * 3600 * 24),
    );
    if (daysSinceCreation > 90) {
      score += 100;
      details.push('Tenure > 90 days (+100)');
    } else if (daysSinceCreation < 30) {
      score -= 50;
      details.push('New user < 30 days (-50)');
    }

    // 2. Transaction Volume
    // Using explicit cast or check for _count
    const txCount = (user as any)._count?.transactions || 0;
    if (txCount > 50) {
      score += 150;
      details.push('High Volume > 50 Txs (+150)');
    } else if (txCount > 10) {
      score += 50;
      details.push('Active User > 10 Txs (+50)');
    }

    // 3. Wallet Health
    if (user.wallet && Number(user.wallet.balance) > 100) {
      score += 50;
      details.push('Positive Balance > R$ 100 (+50)');
    }

    // Cap Score
    score = Math.min(1000, Math.max(0, score));

    return {
      score,
      riskLevel: this.getRiskLevel(score),
      dataSource: 'INTERNAL_HISTORY',
      details,
    };
  }

  /**
   * Forces an external "Serasa" check.
   * MOCKED implementation to save costs during dev.
   */
  async consultExternalSerasa(document: string): Promise<RiskAnalysisResult> {
    this.logger.warn(
      `$$$ CONSULTA SERASA COBRADA (MOCK) para documento: ${document} $$$`,
    );

    // Cost Simulation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Determinisitc Mock based on last digit of document
    const lastDigit = parseInt(document.replace(/\D/g, '').slice(-1)) || 0;

    let simulatedScore = 0;
    if (lastDigit > 7)
      simulatedScore = 900; // Good
    else if (lastDigit > 4)
      simulatedScore = 600; // Medium
    else simulatedScore = 300; // Bad

    return {
      score: simulatedScore,
      riskLevel: this.getRiskLevel(simulatedScore),
      dataSource: 'SERASA_MOCK',
      details: [
        'External Data Source',
        'Protestos: 0',
        'Restrições: Nada Consta',
      ],
    };
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 800) return 'LOW';
    if (score >= 600) return 'MEDIUM';
    if (score >= 400) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * [v4.2] RECALCULO DE CRÉDITO HIERÁRQUICO
   * Disparado sempre que uma recarga é feita (Sinal de Boa Fé).
   */
  @OnEvent('transaction.recharge.created')
  async recalculateCredit(payload: { userId: string; amount: number }) {
    const { userId, amount } = payload;
    this.logger.log(
      `Recalculating Credit for User ${userId} after recharge of R$ ${amount}...`,
    );

    try {
      // 1. Fetch User Hierarchy (School -> Plan)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          school: {
            include: { plan: true },
          },
          wallet: true,
        },
      });

      if (!user || !user.school || !user.school.plan) {
        this.logger.warn(
          `User ${userId} has no School/Plan. Skipping credit update.`,
        );
        return;
      }

      // 2. Determine Plan Ceiling (Hard Limit)
      const planCeiling = Number(user.school.plan.creditCeiling);

      // 3. Determine Individual Score Limit (Merit based)
      // Lógica SImples por enquanto:
      // Score > 800 (LOW Risk) -> R$ 100.00
      // Score > 600 (MEDIUM Risk) -> R$ 50.00
      // Score > 400 (HIGH Risk) -> R$ 20.00
      // CRITICAL -> R$ 0.00
      const analysis = await this.calculateInternalScore(userId);
      let scoreLimit = 0;

      if (analysis.riskLevel === 'LOW') scoreLimit = 100;
      else if (analysis.riskLevel === 'MEDIUM') scoreLimit = 50;
      else if (analysis.riskLevel === 'HIGH') scoreLimit = 20;

      // 4. Hierarchical Application (Lower Wins)
      const finalLimit = Math.min(scoreLimit, planCeiling);

      // 5. Update Wallet
      if (user.wallet && Number(user.wallet.creditLimit) !== finalLimit) {
        await this.prisma.wallet.update({
          where: { id: user.wallet.id },
          data: {
            creditLimit: finalLimit,
            // Se aumentou o limite, desbloqueia? Não, o desbloqueio é via recarga (saldo positivo).
            // O limite é apenas a capacidade.
          },
        });
        this.logger.log(
          `Credit Updated: ScoreLimit=${scoreLimit}, Ceiling=${planCeiling} => Final=${finalLimit}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to recalculate credit for ${userId}`, error);
    }
  }

  /**
   * [v4.2] DASHBOARD DE GUERRA
   * Retorna métricas de risco sistêmico (VGV e Buckets de Atraso).
   */
  async getSystemicRiskMetrics() {
    try {
      this.logger.log('Calculating Systemic Risk Metrics...');

      // Encontra todas as carteiras negativas
      const debtors = await this.prisma.wallet.findMany({
        where: { balance: { lt: 0 } },
        select: { balance: true, negativeSince: true },
      });

      this.logger.log(`Found ${debtors.length} debtors.`);

      let totalVGV = 0;
      const buckets = {
        '0-7': 0,
        '8-15': 0,
        '16-30': 0,
        '30+': 0,
      };

      const now = new Date().getTime();

      for (const wallet of debtors) {
        const debt = Math.abs(Number(wallet.balance));
        totalVGV += debt;

        if (!wallet.negativeSince) {
          // Fallback: If no negativeSince but balance is negative, treat as fresh (0-7)
          buckets['0-7'] += debt;
          continue;
        }

        const daysOverdue = Math.floor(
          (now - new Date(wallet.negativeSince).getTime()) / (1000 * 3600 * 24),
        );

        if (daysOverdue <= 7) buckets['0-7'] += debt;
        else if (daysOverdue <= 15) buckets['8-15'] += debt;
        else if (daysOverdue <= 30) buckets['16-30'] += debt;
        else buckets['30+'] += debt;
      }

      this.logger.log(`VGV Calculated: ${totalVGV}`);

      return {
        vgv: totalVGV,
        buckets,
        count: debtors.length,
      };
    } catch (error) {
      this.logger.error('Error calculating risk metrics', error);
      throw new InternalServerErrorException(
        'Failed to calculate risk metrics',
      );
    }
  }
}
