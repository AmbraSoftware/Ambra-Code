import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import * as bcrypt from 'bcrypt';

type OrderStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';

@Injectable()
export class CanteenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
  ) { }

  async getStudentByNfcId(
    nfcId: string,
    schoolId: string | null,
    canteenId: string | null,
  ) {
    if (!schoolId) {
      throw new ForbiddenException('Acesso negado. Usuário não está associado a uma escola.');
    }

    if (!canteenId) {
      throw new ForbiddenException(
        'Acesso negado. Operador não está associado a uma cantina.',
      );
    }

    const normalizedNfcId = nfcId.trim().toUpperCase();
    if (!normalizedNfcId) {
      throw new BadRequestException('NFC inválido.');
    }

    const student = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        role: 'STUDENT',
        schoolId,
        nfcId: normalizedNfcId,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        class: true,
        wallet: {
          select: {
            balance: true,
            isDebtBlocked: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return student;
  }

  async searchStudentsForPos(
    schoolId: string | null,
    canteenId: string | null,
    search?: string,
    take?: string,
  ) {
    if (!schoolId) {
      throw new ForbiddenException('Acesso negado. Usuário não está associado a uma escola.');
    }

    if (!canteenId) {
      throw new ForbiddenException(
        'Acesso negado. Operador não está associado a uma cantina.',
      );
    }

    const normalizedSearch = (search || '').trim();
    if (normalizedSearch.length < 3) {
      return [];
    }

    const takeNumber = Math.min(Math.max(Number(take || 5) || 5, 1), 20);

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        role: 'STUDENT',
        schoolId,
        OR: [
          { name: { contains: normalizedSearch, mode: 'insensitive' } },
          { class: { contains: normalizedSearch, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        class: true,
        wallet: {
          select: {
            balance: true,
            isDebtBlocked: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take: takeNumber,
    });
  }

  async getOrderByHashForScan(orderHash: string, canteenId: string | null) {
    if (!canteenId) {
      throw new ForbiddenException(
        'Acesso negado. Operador não está associado a uma cantina.',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { orderHash },
      select: {
        id: true,
        status: true,
        student: { select: { name: true } },
        items: {
          select: {
            quantity: true,
            product: { select: { name: true, canteenId: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('QR Code inválido. Pedido não encontrado.');
    }

    const firstItem = order.items[0];
    if (!firstItem || firstItem.product.canteenId !== canteenId) {
      throw new ForbiddenException('Este pedido não pertence à sua cantina.');
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new ConflictException(
        `Este pedido já foi ${order.status === 'DELIVERED' ? 'entregue' : 'cancelado'}.`,
      );
    }

    if (order.status !== 'PAID') {
      throw new BadRequestException(
        'Este pedido ainda não foi pago e não pode ser entregue.',
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status, ...displayOrder } = order;
    return displayOrder;
  }

  async getOrdersByStatus(
    canteenId: string | null,
    status: OrderStatus = 'PAID',
  ) {
    if (!canteenId) {
      throw new ForbiddenException(
        'Acesso negado. Operador não está associado a uma cantina.',
      );
    }

    return this.prisma.order.findMany({
      where: {
        status: status, // Filtra pelo status fornecido
        items: {
          some: {
            product: {
              canteenId: canteenId,
            },
          },
        },
      },
      select: {
        id: true,
        orderHash: true,
        createdAt: true,
        totalAmount: true,
        student: {
          select: { name: true },
        },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async deliverOrder(orderId: string, canteenId: string | null) {
    if (!canteenId) {
      throw new ForbiddenException(
        'Acesso negado. Operador não está associado a uma cantina.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            id: orderId,
            status: 'PAID',
            items: { some: { product: { canteenId: canteenId } } },
          },
        });

        if (!order) {
          throw new NotFoundException(
            'Pedido não encontrado, já entregue ou não pertence à sua cantina.',
          );
        }

        await this.stockService.finalizeOrderDeliveryInTransaction(
          tx,
          orderId,
          canteenId,
        );

        const deliveredOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });

        return deliveredOrder;
      },
      {
        isolationLevel: 'Serializable',
      },
    );
  }

  // --- Management Methods (School Admin) ---

  async findAll(schoolId: string) {
    return this.prisma.canteen.findMany({
      where: { schoolId, deletedAt: null },
      include: {
        _count: {
          select: { operators: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    schoolId: string,
    data: { name: string; type: 'COMMERCIAL' | 'GOVERNMENTAL' },
  ) {
    return this.prisma.canteen.create({
      data: {
        name: data.name,
        type: data.type,
        schoolId,
      },
    });
  }

  async findOne(canteenId: string, schoolId: string) {
    const canteen = await this.prisma.canteen.findFirst({
      where: { id: canteenId, schoolId, deletedAt: null },
      include: {
        operators: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!canteen) {
      throw new NotFoundException('Cantina não encontrada.');
    }

    return canteen;
  }

  async addOperator(
    canteenId: string,
    schoolId: string,
    data: { name: string; email: string; passwordHash: string },
  ) {
    // Verifica se a cantina existe e pertence à escola
    await this.findOne(canteenId, schoolId);

    // Verifica se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(data.passwordHash, 10);

    // Cria o operador vinculado à cantina
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: 'OPERATOR_SALES',
        roles: ['OPERATOR_SALES'],
        schoolId,
        canteenId,
        mustChangePassword: true, // Força troca de senha no primeiro login para segurança
        wallet: { create: {} }, // Operadores também podem ter wallet
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  }

  async removeOperator(
    canteenId: string,
    operatorId: string,
    schoolId: string,
  ) {
    await this.findOne(canteenId, schoolId);

    const operator = await this.prisma.user.findFirst({
      where: { id: operatorId, canteenId, schoolId },
    });

    if (!operator) {
      throw new NotFoundException('Operador não encontrado nesta cantina.');
    }

    // Deletar usuário (simplificado para MVP)
    return this.prisma.user.delete({
      where: { id: operatorId },
    });
  }

  /**
   * [v4.9] MERENDA IQ (Weekly Menu)
   * Gerencia o cardápio semanal de alimentação escolar (Público/Governamental).
   * Diferente do cardápio comercial, foca em valor nutricional.
   */
  async createOrUpdateDailyMenu(
    canteenId: string,
    date: Date,
    items: any,
    nutritionalInfo?: any,
  ) {
    // Check if menu already exists for this day to update instead of fail
    const existing = await this.prisma.weeklyMenu.findFirst({
      where: {
        canteenId,
        date: date,
      },
    });

    if (existing) {
      return this.prisma.weeklyMenu.update({
        where: { id: existing.id },
        data: {
          items,
          nutritionalInfo,
        },
      });
    }

    return this.prisma.weeklyMenu.create({
      data: {
        canteenId,
        date,
        items,
        nutritionalInfo,
      },
    });
  }

  /**
   * Busca o cardápio da semana para exibição aos pais/alunos.
   */
  async getWeeklyMenu(canteenId: string, startDate: Date, endDate: Date) {
    return this.prisma.weeklyMenu.findMany({
      where: {
        canteenId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}
