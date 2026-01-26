import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SchoolStatus, PlanStatus } from '@prisma/client';

/**
 * RIZO CORE - BILLING ENGINE v3.8.5
 * Gerencia o faturamento das escolas e o ciclo de vida das subscrições.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ativa ou renova o plano de uma escola após confirmação de pagamento da mensalidade.
   */
  async activateSchoolSubscription(
    schoolId: string,
    planId: string,
    durationMonths: number = 1,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validar existência da escola e do plano
      const school = await tx.school.findUnique({ where: { id: schoolId } });
      if (!school) throw new NotFoundException('Instituição não localizada.');

      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan || plan.status !== PlanStatus.ACTIVE) {
        throw new BadRequestException('Plano inexistente ou descontinuado.');
      }

      const now = new Date();
      const expirationDate = new Date();
      expirationDate.setMonth(now.getMonth() + durationMonths);

      // 2. Atualizar status da escola e vincular o plano
      const updatedSchool = await tx.school.update({
        where: { id: schoolId },
        data: {
          planId: plan.id,
          status: SchoolStatus.ACTIVE,
          updatedAt: now,
        },
      });

      // 3. Registrar no Histórico de Planos para Auditoria e Pro-rata
      await tx.schoolPlanHistory.create({
        data: {
          schoolId,
          planId,
          startedAt: now,
          endedAt: expirationDate,
        },
      });

      this.logger.log(
        `Billing: Escola ${school.name} ativada no plano ${plan.name} até ${expirationDate.toISOString()}`,
      );

      return updatedSchool;
    });
  }

  /**
   * Varredura de Segurança: Suspende escolas com planos expirados.
   * Pode ser disparado por um Cron Job no TasksModule.
   */
  async checkAndSuspendExpiredSchools() {
    const now = new Date();

    // Busca escolas ativas onde o último histórico de plano já venceu
    const expiredHistories = await this.prisma.schoolPlanHistory.findMany({
      where: {
        endedAt: { lt: now },
        school: { status: SchoolStatus.ACTIVE },
      },
      include: { school: true },
    });

    for (const history of expiredHistories) {
      await this.prisma.school.update({
        where: { id: history.schoolId },
        data: { status: SchoolStatus.SUSPENDED },
      });
      this.logger.warn(
        `SaaS Alert: Escola ${history.school.name} suspensa por expiração de plano.`,
      );
    }

    return { suspendedCount: expiredHistories.length };
  }
}
