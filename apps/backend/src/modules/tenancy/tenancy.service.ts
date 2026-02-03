import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import {
  UserRole,
  SchoolStatus,
  Prisma,
  PlanStatus,
  CanteenType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * TENANCY SERVICE v3.8.5 - NODUM KERNEL MASTER
 * Gerencia a infraestrutura multi-multi-tenant.
 * Cada Unidade (Escola) é vinculada a um Sistema (Affiliate) e a um Plano.
 */
import { AsaasService } from '../asaas/asaas.service';

@Injectable()
export class TenancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  /**
   * Inauguração Atômica de Unidade Escolar.
   * O 'porquê': Nível de isolamento 'Serializable' garante que não existam colisões
   * de Slug ou CNPJ mesmo sob altíssima concorrência de criação de tenants.
   */
  async createSchoolWithAdmin(dto: CreateSchoolDto) {
    const result = await this.prisma.$transaction(
      async (tx) => {
        // 1. Validar se o Sistema Affiliate (ex: AMBRA) existe e está ativo
        const system = await tx.platformSystem.findUnique({
          where: { id: dto.systemId },
        });
        if (!system || system.status !== 'ACTIVE') {
          throw new NotFoundException(
            'Sistema Affiliate não encontrado ou inativo.',
          );
        }

        // 2. Validar se o plano comercial existe e está ativo
        const plan = await tx.plan.findUnique({
          where: { id: dto.planId },
        });
        if (!plan || plan.status !== PlanStatus.ACTIVE) {
          throw new NotFoundException(
            'Plano comercial não encontrado ou descontinuado.',
          );
        }

        // 3. Verificar duplicidade de CNPJ ou Slug (Identidade da Escola)
        const existing = await tx.school.findFirst({
          where: { OR: [{ taxId: dto.taxId }, { slug: dto.slug }] },
        });
        if (existing) {
          throw new ConflictException(
            'Uma instituição com este CNPJ ou Slug já está cadastrada.',
          );
        }

        // 4. Criar a Unidade (Tenant)
        const schoolConfig: any = {
          primaryColor: '#FC5407', // Aerospace Orange (AMBRA Default)
          logo: 'https://cdn.nodum.app/ambra-default.png',
          // Salva flags de módulos híbridos
          hasMerenda: dto.hasMerenda || false,
          hasCanteen: dto.hasCanteen || false,
        };

        const school = await tx.school.create({
          data: {
            name: dto.name,
            taxId: dto.taxId,
            slug: dto.slug,
            systemId: system.id,
            planId: plan.id,
            status: SchoolStatus.ACTIVE,
            config: schoolConfig,
          } as any,
        });

        // 5. Registrar Histórico Inicial de Plano (Essencial para Billing)
        await tx.schoolPlanHistory.create({
          data: {
            schoolId: school.id,
            planId: plan.id,
            startedAt: new Date(),
          },
        });

        // 6. Criar o Administrador Mestre da Escola
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
        const admin = await tx.user.create({
          data: {
            name: dto.adminName,
            email: dto.adminEmail,
            passwordHash: hashedPassword,
            role: UserRole.SCHOOL_ADMIN,
            roles: [UserRole.SCHOOL_ADMIN],
            schoolId: school.id,
            wallet: {
              create: {
                balance: 0,
                dailySpendLimit: 0,
                allowedDays: [1, 2, 3, 4, 5], // Padrão segunda a sexta
              },
            },
          },
        });

        // 7. Criar Cantinas Automaticamente (se configurado)
        const createdCanteens: any[] = [];

        if (dto.hasCanteen) {
          // Cria cantina comercial (requer operador)
          const commercialCanteen = await tx.canteen.create({
            data: {
              name: `Cantina - ${school.name}`,
              type: CanteenType.COMMERCIAL,
              schoolId: school.id,
              status: 'ACTIVE',
              openingTime: '07:00',
              closingTime: '18:00',
            },
          });
          createdCanteens.push(commercialCanteen);
        }

        if (dto.hasMerenda) {
          // Cria cantina governamental (merenda - não requer operador)
          const governmentalCanteen = await tx.canteen.create({
            data: {
              name: `Refeitório Merenda - ${school.name}`,
              type: CanteenType.GOVERNMENTAL,
              schoolId: school.id,
              operatorId: null, // Merenda não requer operador (governo)
              status: 'ACTIVE',
              openingTime: '07:00',
              closingTime: '18:00',
            },
          });
          createdCanteens.push(governmentalCanteen);
        }

        return {
          message: 'Unidade industrial inaugurada com sucesso.',
          schoolId: school.id,
          adminId: admin.id,
          system: system.name,
          plan: plan.name,
          canteens: createdCanteens.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
          })),
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    // [v4.1] SaaS Monetization (Post-Hook)
    // Create Subscription asynchronously to avoid locking the transaction
    try {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });

      if (plan && Number(plan.price) > 0) {
        // 1. Ensure Asaas Customer (School Entity)
        const customerId = await this.asaasService.ensureCustomer({
          name: dto.name,
          cpfCnpj: dto.taxId,
          email: dto.adminEmail,
        });

        // 2. Create Subscription
        const sub = await this.asaasService.createSubscription({
          customer: customerId,
          billingType: 'BOLETO', // B2B Standard
          value: Number(plan.price),
          nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0], // +30 days
          cycle: 'MONTHLY',
          description: `Assinatura Nodum - Plano ${plan.name}`,
        });

        // 3. Link to School
        await this.prisma.school.update({
          where: { id: result.schoolId }, // result is from the transaction above
          data: {
            asaasCustomerId: customerId,
            subscriptionId: sub.id,
          },
        });
      }
    } catch (error) {
      // Non-blocking error: Log and continue
      console.error(
        `[SaaS Warning] Failed to provision Asaas Subscription for School ${dto.name}:`,
        error.message,
      );
    }

    return result;
  }

  /**
   * Atualiza uma escola existente.
   * O 'porquê': Se o plano mudar, registra histórico para billing. Valida slug único.
   */
  async updateSchool(id: string, dto: UpdateSchoolDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const school = await tx.school.findUnique({
          where: { id },
          include: { plan: true },
        });

        if (!school) {
          throw new NotFoundException('Escola não encontrada.');
        }

        // Se está tentando alterar o slug, verificar unicidade
        if (dto.slug && dto.slug !== school.slug) {
          const existingSlug = await tx.school.findUnique({
            where: { slug: dto.slug },
          });

          if (existingSlug) {
            throw new ConflictException('Já existe uma escola com este slug.');
          }
        }

        // Se o plano mudou, validar e registrar histórico
        if (dto.planId && dto.planId !== school.planId) {
          const newPlan = await tx.plan.findUnique({
            where: { id: dto.planId },
          });

          if (!newPlan || newPlan.status !== PlanStatus.ACTIVE) {
            throw new NotFoundException('Plano não encontrado ou inativo.');
          }

          // Finalizar plano anterior
          await tx.schoolPlanHistory.updateMany({
            where: {
              schoolId: id,
              endedAt: null,
            },
            data: {
              endedAt: new Date(),
            },
          });

          // Iniciar novo plano
          await tx.schoolPlanHistory.create({
            data: {
              schoolId: id,
              planId: dto.planId,
              startedAt: new Date(),
            },
          });
        }

        return tx.school.update({
          where: { id },
          data: dto as any,
          include: {
            system: { select: { name: true, slug: true } },
            plan: { select: { name: true } },
          } as any,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /**
   * Remove uma escola do ecossistema.
   * O 'porquê': Proteção contra remoção de escolas com usuários ativos (integridade referencial).
   */
  async deleteSchool(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, orders: true } },
      } as any,
    });

    if (!school) {
      throw new NotFoundException('Escola não encontrada.');
    }

    if ((school as any)._count.users > 0) {
      throw new BadRequestException(
        `Impossível remover escola com ${(school as any)._count.users} usuário(s) ativo(s). Desative ou migre os usuários primeiro.`,
      );
    }

    if ((school as any)._count.orders > 0) {
      throw new BadRequestException(
        'Impossível remover escola com histórico de pedidos. Considere suspender ao invés de remover.',
      );
    }

    await this.prisma.school.delete({
      where: { id },
    });

    return {
      message: 'Escola removida com sucesso.',
      schoolName: school.name,
    };
  }

  /**
   * Listagem para o Console Global (NODUM) filtrada por Sistema.
   */
  async findAllBySystem(systemSlug: string) {
    return this.prisma.school.findMany({
      where: { system: { slug: systemSlug } } as any,
      include: {
        plan: { select: { name: true, price: true } },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Listagem de todas as escolas (Visão Gabriel SuperAdmin)
   */
  async listAllSchools(status?: string) {
    const where: Prisma.SchoolWhereInput = status
      ? { status: status as SchoolStatus }
      : {};

    return this.prisma.school.findMany({
      where,
      include: {
        system: { select: { name: true, slug: true } },
        plan: { select: { name: true, price: true } },
        _count: { select: { users: true } },
      } as any,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * B2G: Gestão de Governos (Prefeituras)
   */
  async listGovernments() {
    return this.prisma.government.findMany({
      include: {
        _count: { select: { schools: true } },
        schools: {
          select: { id: true, name: true, slug: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createGovernment(dto: any) {
    return this.prisma.government.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        taxId: dto.taxId,
        system: { connect: { id: dto.systemId } },
        plan: { connect: { id: dto.planId } },
      },
    });
  }

  async updateGovernment(id: string, dto: any) {
    return this.prisma.government.update({
      where: { id },
      data: dto,
    });
  }

  async deleteGovernment(id: string) {
    // Check integrity constraints
    const government = await this.prisma.government.findUnique({
      where: { id },
      include: { _count: { select: { schools: true } } },
    });

    if (!government) throw new NotFoundException('Governo não encontrado.');

    if (government._count.schools > 0) {
      throw new BadRequestException(
        'Não é possível remover governo com escolas vinculadas.',
      );
    }

    return this.prisma.government.delete({ where: { id } });
  }
}
