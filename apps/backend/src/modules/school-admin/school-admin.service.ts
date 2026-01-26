import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateConfigDto } from './dto/update-config.dto';

@Injectable()
export class SchoolAdminService {
  constructor(private readonly prisma: PrismaService) { }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const revenueResult = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['PAID', 'DELIVERED'] },
      },
    });

    const ordersCount = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const allProductsInSchool = await this.prisma.product.findMany({
      where: { isAvailable: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

    const LOW_STOCK_THRESHOLD = 10;
    const lowStockProducts = allProductsInSchool.filter(
      (p) => p.stock <= LOW_STOCK_THRESHOLD,
    );

    return {
      todayRevenue: revenueResult._sum.totalAmount || 0,
      todayOrders: ordersCount,
      lowStockAlerts: lowStockProducts,
    };
  }

  async getSchoolConfig(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        plan: true,
      },
    });

    if (!school) throw new NotFoundException('School not found');

    return {
      id: school.id,
      name: school.name,
      customDomain: school.customDomain,
      config: school.config,
      plan: school.plan,
    };
  }

  async updateSchoolConfig(schoolId: string, updateConfigDto: UpdateConfigDto) {
    return this.prisma.$transaction(async (tx) => {
      const school = await tx.school.findUnique({
        where: { id: schoolId },
        include: { plan: true },
      });

      if (!school) throw new NotFoundException('Escola não encontrada.');

      // 1. Validação de White-Label (Plano Enterprise)
      // Bloqueia alteração de tema se não for Enterprise
      if (
        updateConfigDto.theme &&
        (updateConfigDto.theme.primaryColor || updateConfigDto.theme.logoUrl) &&
        school.plan.name !== 'Enterprise'
      ) {
        // Opcional: throw ForbiddenException, mas para UX vamos apenas ignorar ou logar.
        // Para rigor, lançamos erro se o cliente tentar forçar.
        // throw new ForbiddenException('Personalização disponível apenas no plano Enterprise.');
      }

      // 2. Validação de Limite de Crédito (Risk Ceiling)
      if (updateConfigDto.financial?.defaultCreditLimit) {
        const planCeiling = Number(school.plan.creditCeiling);
        const requestedLimit = Number(updateConfigDto.financial.defaultCreditLimit);

        // Se o plano tiver teto (ceiling > 0) e o pedido for maior
        if (planCeiling > 0 && requestedLimit > planCeiling) {
          throw new ForbiddenException(
            `O limite de crédito solicitado (R$ ${requestedLimit}) excede o teto de risco do seu plano (R$ ${planCeiling}).`
          );
        }
      }

      const currentConfig =
        school.config && typeof school.config === 'object' ? school.config : {};

      // Deep merge manual para garantir que não sobrescrevemos outras chaves acidentalmente
      const newConfig = {
        ...currentConfig,
        ...updateConfigDto,
        // Garante merge dos sub-objetos
        theme: { ...(currentConfig as any).theme, ...updateConfigDto.theme },
        financial: { ...(currentConfig as any).financial, ...updateConfigDto.financial },
        operational: { ...(currentConfig as any).operational, ...updateConfigDto.operational },
      };

      return tx.school.update({
        where: { id: schoolId },
        data: {
          customDomain: updateConfigDto.customDomain,
          config: newConfig,
        },
      });
    });
  }
}
