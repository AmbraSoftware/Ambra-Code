import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InvitationStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto, schoolId: string) {
    const { password, profile, taxId, mobilePhone, roles, role, ...userData } = createUserDto;

    // Validação: senha obrigatória na criação
    if (!password) {
      throw new BadRequestException('Senha é obrigatória para criar usuário.');
    }

    // Validação: email obrigatório para alguns tipos de usuário
    // Operadores podem ter email opcional (gerado automaticamente)
    const isOperator = role === 'OPERATOR_SALES' || role === 'OPERATOR_MEAL';
    if (!isOperator && !userData.email) {
      throw new BadRequestException('Email é obrigatório para este tipo de usuário.');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // Se email foi fornecido, verifica duplicata
        if (userData.email) {
          const existingUser = await tx.user.findUnique({
            where: { email: userData.email },
          });
          if (existingUser) {
            throw new ConflictException('Um usuário com este email já existe.');
          }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Determina roles array: usa roles fornecido ou cria array com role único
        const rolesArray = roles && roles.length > 0 
          ? roles.map(r => r as any)
          : [role as any];

        // Prepare Wallet Data (Student only)
        const walletData = role === 'STUDENT' ? {
            create: {
                dailySpendLimit: profile?.dailyLimit || 0.00
            }
        } : undefined;

        // Gera email automático para operadores se não fornecido
        const finalEmail = userData.email || `operator.${Date.now()}@ambra.local`;

        const user = await tx.user.create({
          data: {
            name: userData.name,
            email: finalEmail,
            document: taxId,
            class: profile?.class,
            passwordHash: hashedPassword,
            mustChangePassword: true,
            role: role as any, // Legacy single role
            roles: rolesArray, // Multi-role support
            schoolId,
            wallet: walletData,
          },
        });

        // Handle Nutritional Profile (Allergies)
        if (profile?.restrictions && profile.restrictions.length > 0) {
            await tx.nutritionalProfile.create({
                data: {
                    userId: user.id,
                    allergies: profile.restrictions,
                    preferences: []
                }
            });
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _, ...result } = user;
        return result;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async bulkCreate(bulkDto: { users: CreateUserDto[] }, schoolId: string) {
    const results = {
      created: 0,
      errors: [] as { email: string; error: string }[],
      details: [] as { email: string; status: 'SUCCESS' | 'ERROR'; message?: string }[],
    };

    for (const userDto of bulkDto.users) {
      try {
        await this.create(userDto, schoolId);
        results.created++;
        results.details.push({ email: userDto.email || 'N/A', status: 'SUCCESS' });
      } catch (error: any) {
        let msg = 'Erro desconhecido';
        if (error instanceof ConflictException) {
          msg = 'Email duplicado';
        } else if (error.code === 'P2002') {
          msg = 'Registro duplicado (Email ou CPF)';
        } else if (error.message) {
          msg = error.message;
        }
        results.errors.push({ email: userDto.email || 'N/A', error: msg });
        results.details.push({ email: userDto.email || 'N/A', status: 'ERROR', message: msg });
      }
    }
    return results;
  }

  /**
   * [v4.5] Enhanced findAll with Audit Filters
   * O 'porquê': Permite que gestores identifiquem rapidamente alunos inadimplentes ou inativos.
   * 
   * NOTA TÉCNICA (Performance): Para escolas com 2.200+ alunos, considere adicionar um campo
   * `lastActivityAt` na tabela User para otimizar o filtro `inactive_30d`. A query atual usa
   * uma subquery com `transactions: { none: {...} }` que pode ficar lenta em grandes volumes.
   * 
   * @param schoolId - ID da escola (RLS)
   * @param role - Filtro por role(s)
   * @param withDeleted - Incluir usuários deletados
   * @param filter - Filtro de auditoria: 'negative_balance' | 'inactive_30d'
   */
  async findAll(
    schoolId?: string,
    role?: UserRole | UserRole[],
    withDeleted: boolean = false,
    filter?: 'negative_balance' | 'inactive_30d',
  ) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build where clause
    const where: any = {
      ...(withDeleted ? {} : { deletedAt: null }),
      ...(schoolId ? { schoolId } : {}),
      ...(role
        ? Array.isArray(role)
          ? { role: { in: role } }
          : { role }
        : {}),
    };

    // Apply audit filters
    if (filter === 'negative_balance') {
      where.wallet = { balance: { lt: 0 } };
    } else if (filter === 'inactive_30d') {
      where.transactions = {
        none: {
          createdAt: { gte: thirtyDaysAgo },
        },
      };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        createdAt: true,
        lastLoginAt: true,
        deletedAt: true,
        wallet: {
          select: {
            id: true,
            balance: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * [v4.5] Student Statistics for Filter Counters
   * O 'porquê': Permite que o frontend exiba contadores dinâmicos nos botões de filtro,
   * dando ao gestor uma visão imediata da situação da escola (inadimplentes, inativos).
   * 
   * Performance: Usa Promise.all() para executar as 3 queries em paralelo.
   * Cache: O controller deve aplicar cache Redis de 60s para evitar sobrecarga.
   */
  async getStudentStats(schoolId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const baseWhere: any = {
      deletedAt: null,
      role: 'STUDENT',
      ...(schoolId ? { schoolId } : {}),
    };

    const [total, negativeBalance, inactive30d] = await Promise.all([
      // Total de alunos ativos
      this.prisma.user.count({
        where: baseWhere,
      }),

      // Alunos com saldo negativo
      this.prisma.user.count({
        where: {
          ...baseWhere,
          wallet: { balance: { lt: 0 } },
        },
      }),

      // Alunos inativos (sem transações nos últimos 30 dias)
      this.prisma.user.count({
        where: {
          ...baseWhere,
          transactions: {
            none: {
              createdAt: { gte: thirtyDaysAgo },
            },
          },
        },
      }),
    ]);

    return {
      total,
      negativeBalance,
      inactive30d,
    };
  }

  /**
   * [v4.5] Exportação CSV Financeira com Conformidade Brasileira
   * O 'porquê': Permite que gestores exportem relatórios financeiros para Excel
   * com total conformidade ao formato brasileiro (separador ;, fuso horário correto).
   * 
   * @param schoolId - ID da escola (RLS)
   * @param startDate - Data inicial (opcional, padrão: 30 dias atrás)
   * @param endDate - Data final (opcional, padrão: hoje)
   * @returns CSV formatado para Excel BR
   */
  async exportFinancialCSV(
    schoolId?: string,
    startDate?: Date,
    endDate?: Date,
    canteenId?: string,
  ): Promise<string> {
    // Configurar fuso horário de Brasília
    const now = new Date();
    const defaultEndDate = endDate || now;
    const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar alunos com wallet e transações
    const students = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: 'STUDENT',
        ...(schoolId ? { schoolId } : {}),
        ...(canteenId ? { canteenId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        lastLoginAt: true,
        wallet: {
          select: {
            balance: true,
            transactions: {
              where: {
                createdAt: {
                  gte: defaultStartDate,
                  lte: defaultEndDate,
                },
              },
              select: {
                type: true,
                amount: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Processar dados
    const rows = students.map((student) => {
      const transactions = student.wallet?.transactions || [];
      const recharges = transactions
        .filter((t) => t.type === 'RECHARGE')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const purchases = transactions
        .filter((t) => t.type === 'PURCHASE')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lastActivity = student.lastLoginAt
        ? new Date(student.lastLoginAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Nunca';

      return {
        nome: student.name,
        email: student.email || 'N/A',
        saldoAtual: (student.wallet?.balance || 0).toFixed(2).replace('.', ','),
        totalRecargas: recharges.toFixed(2).replace('.', ','),
        totalCompras: purchases.toFixed(2).replace('.', ','),
        ultimaAtividade: lastActivity,
      };
    });

    // Gerar CSV com separador Excel BR
    const headers = ['Nome', 'Email', 'Saldo Atual (R$)', 'Total Recargas (R$)', 'Total Compras (R$)', 'Última Atividade'];
    const csvLines = [
      'sep=;', // Instrução para Excel BR
      headers.join(';'),
      ...rows.map((row) =>
        [row.nome, row.email, row.saldoAtual, row.totalRecargas, row.totalCompras, row.ultimaAtividade].join(';'),
      ),
    ];

    return csvLines.join('\n');
  }

  async findOne(id: string) {

    const user = await this.prisma.user.findFirst({
      where: { id: id, deletedAt: null },
      select: {

        id: true,
        name: true,
        email: true,
        role: true,
        schoolId: true,
        canteenId: true,
        createdAt: true,
        dependentRelations: {
          select: { dependent: { select: { id: true, name: true } } },
        },
        guardianRelations: {
          select: { guardian: { select: { id: true, name: true } } },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    // Transformar para formato plano (Backward Compatibility)
    return {
      ...user,
      dependents: user.dependentRelations.map((rel) => rel.dependent),
      guardians: user.guardianRelations.map((rel) => rel.guardian),
    };
  }

  /**
   * CONVITE DE RESPONSÁVEL
   * Resolve o erro: Property 'inviteGuardian' does not exist.
   */
  async inviteGuardian(senderId: string, receiverEmail: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { email: receiverEmail },
    });
    if (!receiver) throw new NotFoundException('Responsável não encontrado.');

    return this.prisma.guardianInvitation.create({
      data: {
        senderId,
        receiverId: receiver.id,
        schoolId: (await this.findOne(senderId)).schoolId!,
        status: InvitationStatus.PENDING,
      },
    });
  }

  /**
   * ACEITE DE CONVITE
   */
  async acceptInvitation(invitationId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const invite = await tx.guardianInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!invite || invite.receiverId !== userId)
        throw new BadRequestException('Convite inválido.');

      await tx.guardianInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.ACCEPTED },
      });

      const sender = await tx.user.findUnique({
        where: { id: invite.senderId },
        include: { dependentRelations: { include: { dependent: true } } },
      });

      if (!sender) {
        throw new NotFoundException('Remetente do convite não encontrado.');
      }

      // Conectar o novo responsável (userId) aos dependentes do remetente
      const dependenciesToCreate = sender.dependentRelations.map((rel) => ({
        guardianId: userId,
        dependentId: rel.dependentId,
      }));

      if (dependenciesToCreate.length > 0) {
        await tx.userDependency.createMany({
          data: dependenciesToCreate,
          skipDuplicates: true,
        });
      }

      return { success: true };
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...dataToUpdate } = updateUserDto;
    let hashedPassword: string | undefined;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dataToUpdate,
        ...(hashedPassword && { password: hashedPassword }),
      } as any,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deletePermanently(id: string) {
    // Check if user exists (even if soft deleted)
    const user = await this.prisma.user.findFirst({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    // Hard Delete
    return this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * ACEITE DE TERMOS (LGPD)
   * Registra o consentimento e cria rastro de auditoria explícito.
   */
  async acceptTerms(
    userId: string,
    version: string,
    ip?: string,
    userAgent?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Atualiza o User
      await tx.user.update({
        where: { id: userId },
        data: {
          termsAccepted: true,
          termsVersion: version,
        } as any,
      });

      // 2. Cria o Log de Consentimento
      await tx.consentLog.create({
        data: {
          userId,
          action: 'ACCEPT_TERMS',
          version,
          ipAddress: ip,
          userAgent,
        },
      });

      return { success: true, message: 'Termos aceitos com sucesso.' };
    });
  }

  /**
   * Busca dependentes de um responsável
   */
  async findDependents(guardianId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: guardianId },
      include: {
        dependentRelations: {
          include: {
            dependent: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                wallet: {
                  select: { id: true, balance: true, dailySpendLimit: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Responsável não encontrado.');

    return user.dependentRelations.map((rel) => rel.dependent);
  }
  async restore(id: string) {
    // Find even if deleted
    const user = await this.prisma.user.findFirst({
      where: { id },
    });

    if (!user) throw new NotFoundException('Usuário não encontrado.');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
