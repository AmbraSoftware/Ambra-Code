/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AsaasService } from '../asaas/asaas.service';
import { Logger } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) { }

  /**
   * Cria uma nova vertical de negócio no ecossistema NODUM.
   * Apenas SUPER_ADMIN tem acesso (protegido no controller).
   */
  async createSystem(dto: CreateSystemDto) {
    const existing = await this.prisma.platformSystem.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Já existe um sistema com este slug.');
    }

    return this.prisma.platformSystem.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        status: 'ACTIVE',
      },
    });
  }

  async findAllSystems() {
    return (this.prisma as any).platformSystem.findMany({
      include: { _count: { select: { schools: true } } },
    });
  }

  /**
   * Atualiza uma vertical de negócio existente.
   * O 'porquê': Validação de slug único e verificação de existência de escolas vinculadas.
   */
  async updateSystem(id: string, dto: UpdateSystemDto) {
    const system = await (this.prisma as any).platformSystem.findUnique({
      where: { id },
      include: { _count: { select: { schools: true } } },
    });

    if (!system) {
      throw new NotFoundException('Sistema não encontrado.');
    }

    // Se está tentando alterar o slug, verificar unicidade
    if (dto.slug && dto.slug !== system.slug) {
      const existingSlug = await (this.prisma as any).platformSystem.findUnique(
        {
          where: { slug: dto.slug },
        },
      );

      if (existingSlug) {
        throw new ConflictException('Já existe um sistema com este slug.');
      }
    }

    return (this.prisma as any).platformSystem.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Remove uma vertical de negócio do ecossistema.
   * O 'porquê': Proteção contra remoção de sistemas com escolas ativas (integridade referencial).
   */
  async deleteSystem(id: string) {
    const system = await (this.prisma as any).platformSystem.findUnique({
      where: { id },
      include: { _count: { select: { schools: true } } },
    });

    if (!system) {
      throw new NotFoundException('Sistema não encontrado.');
    }

    if (system._count.schools > 0) {
      throw new BadRequestException(
        `Impossível remover sistema com ${system._count.schools} escola(s) vinculada(s). Migre ou remova as escolas primeiro.`,
      );
    }

    await (this.prisma as any).platformSystem.delete({
      where: { id },
    });

    return {
      message: 'Sistema removido com sucesso.',
      systemName: system.name,
    };
  }

  /**
   * [v4.9] PLAN MANAGEMENT
   * Criação de Planos SaaS e B2C
   */
  async createPlan(dto: any) {
    // Note: DTO is handled in Controller validation
    return this.prisma.plan.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        target: dto.target || 'SCHOOL_SAAS',
        maxStudents: dto.maxStudents || 100,
        maxCanteens: dto.maxCanteens || 1,
        creditCeiling: dto.creditCeiling || 0,
        feesConfig: dto.feesConfig,
        features: dto.features,
        status: 'ACTIVE',
      },
    });
  }

  async listAllPlans() {
    return this.prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        maxStudents: true,
        status: true,
      },
    });
  }

  async findOnePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    return plan;
  }

  /**
   * [v4.1] PLAN AUTOMATION (Sync with Asaas)
   * Atualiza o plano e replica o novo preço para todas as assinaturas ativas.
   */
  async updatePlan(
    id: string,
    dto: { price?: number; name?: string; description?: string },
  ) {
    // 1. Sanitize input (Allow only schema-defined fields)
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.price !== undefined) data.price = Number(dto.price);
    // Note: description, code, whiteLabel are not yet in Schema, so we ignore them to prevent crashes.

    // 2. Atualiza no Banco Local
    const updatedPlan = await this.prisma.plan.update({
      where: { id },
      data,
    });

    // 2. Se houve alteração de preço, sincronizar com Asaas
    if (dto.price) {
      // Busca escolas ativas neste plano que possuem assinatura vinculada
      const schools = await this.prisma.school.findMany({
        where: {
          planId: id,
          status: 'ACTIVE',
          subscriptionId: { not: null },
        },
        select: { id: true, name: true, subscriptionId: true },
      });

      this.logger.log(
        `[PLAN SYNC] Updating price for ${schools.length} schools on Plan ${updatedPlan.name}...`,
      );

      for (const school of schools) {
        if (school.subscriptionId) {
          await this.asaasService.updateSubscription(school.subscriptionId, {
            value: Number(dto.price),
          });
        }
      }
    }

    return updatedPlan;
  }

  // --- DELETE OPERATIONS (Industrial Grade) ---

  async deletePlan(id: string) {
    return this.prisma.plan.delete({ where: { id } });
  }

  async emptyTrash(type: string) {
    switch (type) {
      case 'users':
        // GROUP: Users (Operators, Clients, etc)
        // Delete all soft-deleted users
        return this.prisma.user.deleteMany({
          where: { deletedAt: { not: null } },
        });

      case 'entities':
        // GROUP: Entities (Systems, Schools, Municipalities)
        // 1. Schools (CANCELED)
        const schools = await this.prisma.school.deleteMany({
          where: { status: 'CANCELED' },
        });
        // 2. Systems (INACTIVE) - Note: System usually doesn't have soft delete flag in schema, using status 'INACTIVE' if implemented or just delete.
        // Assuming Systems uses status 'INACTIVE' for trash as seen in frontend filter.
        // But PlatformSystem delete is strict. We'll try deleteMany for those marked INACTIVE.
        // Ideally we iterate and check constraints, but for 'empty trash' we often force.
        // For now, let's just delete Schools as they are the main volume. Systems are rare.
        return { schools };

      case 'announcements':
        // GROUP: Announcements (Plans, Campaigns)
        // 1. Plans (ARCHIVED/INACTIVE)
        const plans = await this.prisma.plan.deleteMany({
          where: { status: 'RETIRED' },
        });
        // 2. Campaigns (Announcements) (Soft Deleted? Or status?)
        // Announcement model has status string. Frontend filters by 'INACTIVE'.
        const campaigns = await this.prisma.announcement.deleteMany({
          where: { status: 'INACTIVE' },
        });
        return { plans, campaigns };

      default:
        throw new Error('Invalid trash type: ' + type);
    }
  }
  /**
   * [v4.1] DASHBOARD STRATEGIC COMMAND CENTER
   * Retorna KPIs soberanos para o Console.
   */
  async getDashboardStats() {
    const [schools, students, plans, operators, transactions, wallets] =
      await Promise.all([
        this.prisma.school.findMany({ include: { plan: true } }),
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.plan.findMany({ where: { status: 'ACTIVE' } }),
        this.prisma.operator.count(), // [v4.1] Active Operators
        this.prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true, platformFee: true },
        }),
        this.prisma.wallet.aggregate({
          _sum: { balance: true },
        }),
      ]);

    // Financial Core Metrics
    const mrr = schools.reduce(
      (acc, school) => acc + Number(school.plan?.price || 0),
      0,
    );
    const gmv = Number(transactions._sum.amount || 0);
    const netRevenue = Number(transactions._sum.platformFee || 0);
    const financialFloat = Number(wallets._sum.balance || 0);

    // REAL Chart Data: Query actual transactions grouped by month
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactionsByMonth = await this.prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: sixMonthsAgo },
      },
      _sum: {
        amount: true,
        platformFee: true,
      },
    });

    // Group by month and aggregate
    const monthlyData = new Map<string, { planos: number; comissao: number }>();

    transactionsByMonth.forEach((tx) => {
      const monthKey = new Date(tx.createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
      });
      const existing = monthlyData.get(monthKey) || { planos: 0, comissao: 0 };
      existing.planos += Number(tx._sum.amount || 0);
      existing.comissao += Number(tx._sum.platformFee || 0);
      monthlyData.set(monthKey, existing);
    });

    // Convert to array format for chart (last 6 months)
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ];
    const currentMonth = new Date().getMonth();
    const salesData: { date: string; planos: number; comissao: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const monthName = months[monthIndex];
      const data = monthlyData.get(monthName) || { planos: 0, comissao: 0 };
      salesData.push({
        date: monthName,
        planos: Math.round(data.planos),
        comissao: Math.round(data.comissao),
      });
    }

    // REAL Revenue Composition: Only include actual revenue streams
    const revenueComposition = [
      { name: 'Assinaturas (SaaS)', value: mrr }, // Monthly MRR (real)
      { name: 'Taxas (Fintech)', value: netRevenue }, // Transaction fees (real)
    ];

    // Only add Setup/Extras if there's actual data
    // For now, we'll skip these unless you have a way to track them in the DB

    return {
      // KPIs
      mrr,
      gmv,
      netRevenue,
      financialFloat,
      totalSchools: schools.length,
      totalStudents: students,
      activePlans: plans.length,
      activeOperators: operators,

      // Charts (100% Real Data)
      salesHistory: salesData,
      revenueComposition,
    };
  }

  /**
   * [v4.1] GLOBAL OMNI-SEARCH
   * Pesquisa soberana em todo o ecossistema (Users, Schools, Transactions).
   */
  async globalSearch(query: string) {
    if (!query || query.length < 3) return { results: [] };

    // Sanitização básica
    const term = query.trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        term,
      );

    // Executa buscas paralelas para máxima velocidade (Industrial Grade)
    const [users, schools, transactions, systems, plans] = await Promise.all([
      // 1. Search Users (Name, Email or ID)
      this.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            ...(isUuid ? [{ id: term }] : []),
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          school: { select: { name: true } },
        },
      }),

      // 2. Search Schools (Name, Slug, TaxID)
      this.prisma.school.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
            { taxId: { contains: term } },
          ],
        },
        take: 5,
        select: { id: true, name: true, slug: true, status: true },
      }),

      // 3. Search Transactions (ID only usually, or value?)
      // Searching by ID if UUID, otherwise massive scan is dangerous.
      isUuid
        ? this.prisma.transaction.findMany({
          where: { id: term },
          take: 5,
          include: { user: { select: { name: true } } },
        })
        : [],

      // 4. Search Systems
      (this.prisma as any).platformSystem.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { slug: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 3,
        select: { id: true, name: true, slug: true, status: true },
      }),

      // 5. Search Plans
      this.prisma.plan.findMany({
        where: {
          OR: [{ name: { contains: term, mode: 'insensitive' } }],
        },
        take: 3,
        select: { id: true, name: true, status: true, price: true },
      }),
    ]);

    return {
      results: [
        ...users.map((u) => ({
          type: 'USER',
          id: u.id,
          title: u.name,
          subtitle: u.email,
          meta: u.school?.name,
        })),
        ...schools.map((s) => ({
          type: 'SCHOOL',
          id: s.id,
          title: s.name,
          subtitle: s.slug,
          meta: s.status,
        })),
        ...(transactions as any[]).map((t) => ({
          type: 'TX',
          id: t.id,
          title: `TX ${t.id.slice(0, 8)}`,
          subtitle: t.user?.name,
          meta: t.amount,
        })),
        ...(systems as any[]).map((s) => ({
          type: 'SYSTEM',
          id: s.id,
          title: s.name,
          subtitle: s.slug,
          meta: s.status,
        })),
        ...(plans as any[]).map((p) => ({
          type: 'PLAN',
          id: p.id,
          title: p.name,
          subtitle: `R$ ${p.price}`,
          meta: p.status,
        })),
      ],
    };
  }

  /**
   * Obter assinantes de um plano com métricas financeiras
   */
  async getPlanSubscribers(planId: string) {
    const { addMonths, differenceInDays } = await import('date-fns');

    // Buscar plano
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    // Buscar escolas que usam este plano
    const schools = await this.prisma.school.findMany({
      where: {
        planId: planId,
        status: { not: 'CANCELED' },
      },
    });

    const subscribers = schools.map((school) => {
      // Simular próxima cobrança (30 dias após criação)
      const nextPayment = addMonths(school.createdAt, 1);
      const daysUntilNextPayment = differenceInDays(nextPayment, new Date());

      // Determinar status
      let status: 'ACTIVE' | 'OVERDUE' | 'CANCELLED' = 'ACTIVE';
      if (school.status === 'CANCELED') {
        status = 'CANCELLED';
      } else if (daysUntilNextPayment < 0) {
        status = 'OVERDUE';
      }

      // Calcular valores
      const amount = Number(plan.price) || 0;
      // 10% de fee da plataforma
      const platformFee = amount * 0.1;

      return {
        schoolId: school.id,
        schoolName: school.name,
        lastPayment: null, // Não temos histórico de transações por escola
        nextPayment,
        amount,
        platformFee,
        status,
        daysUntilNextPayment,
      };
    });

    // Calcular métricas agregadas
    const activeSubscribers = subscribers.filter(
      (s) => s.status === 'ACTIVE',
    ).length;
    const overdueSubscribers = subscribers.filter(
      (s) => s.status === 'OVERDUE',
    ).length;
    const mrr = subscribers
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.amount, 0);
    const platformRevenue = subscribers
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + s.platformFee, 0);

    const metrics = {
      totalSubscribers: subscribers.length,
      mrr,
      platformRevenue,
      activeSubscribers,
      overdueSubscribers,
    };

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
      },
      subscribers,
      metrics,
    };
  }
  // --- CICLO DE VIDA (Lifecycle) ---

  // SYSTEM
  async deactivateSystem(id: string) {
    return (this.prisma as any).platformSystem.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async restoreSystem(id: string) {
    return (this.prisma as any).platformSystem.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  // SCHOOL
  async deactivateSchool(id: string) {
    return this.prisma.school.update({
      where: { id },
      data: { status: 'SUSPENDED', active: false },
    });
  }

  async restoreSchool(id: string) {
    return this.prisma.school.update({
      where: { id },
      data: { status: 'ACTIVE', active: true },
    });
  }

  // PLAN
  async deactivatePlan(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { status: 'RETIRED' },
    });
  }

  async restorePlan(id: string) {
    return this.prisma.plan.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}
