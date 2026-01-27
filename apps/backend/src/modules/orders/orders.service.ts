import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionService } from '../transactions/transactions.service';
import { StockService } from '../stock/stock.service';
import { CreateOrderDto, CreateOrderItemDto } from '@nodum/shared';
import { randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { OrderStatus, Prisma, Product } from '@prisma/client';

/**
 * ORDERS SERVICE v3.8.5 - MASTER INDUSTRIAL (RIZO & AMBRA)
 * Orquestra o checkout atômico integrando Finanças, Estoque e Controle Parental.
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly stockService: StockService,
    private readonly auditService: AuditService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  /**
   * Processamento de Pedido com Isolamento 'Serializable'
   * Garante integridade absoluta entre saldo, estoque e restrições.
   */
  async create(buyerId: string, createOrderDto: CreateOrderDto) {
    const { studentId, items, scheduledFor } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('O pedido deve conter pelo menos um item.');
    }

    // [v4.1] Validação de Reserva Antecipada
    let scheduledDate: Date | undefined;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      const now = new Date();

      // Regra 1: Não pode agendar para o passado
      if (scheduledDate < now) {
        throw new BadRequestException('A data de agendamento deve ser futura.');
      }

      // Regra 2: Tolerância mínima de 30 minutos (Business Rule)
      // Evita confusão com pedido instantâneo
      const minAdvance = new Date(now.getTime() + 30 * 60000);
      if (scheduledDate < minAdvance) {
        throw new BadRequestException('Reservas devem ser feitas com no mínimo 30 minutos de antecedência.');
      }
    }

    // A transação Serializable impede "Double Spending" e erros de estoque concorrente.
    const paidOrder = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // ETAPA 1: Busca e Validação de Produtos
        const productIds = items.map((item) => item.productId);
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, deletedAt: null },
        });

        if (products.length !== productIds.length) {
          throw new NotFoundException(
            'Um ou mais produtos não foram encontrados ou foram removidos.',
          );
        }

        // ETAPA 1.5: Verificação de Restrições Parentais (RIZO FOOD)
        await this.checkRestrictions(tx, studentId, items, products);

        // ETAPA 1.6: Verificação de Segurança (Safety Switch) e Dias Permitidos
        const wallet = await tx.wallet.findUnique({
          where: { userId: studentId },
          include: { user: { select: { schoolId: true } } },
        });

        if (!wallet || !wallet.user) {
          throw new NotFoundException(
            `Carteira ou vínculo institucional do beneficiário não localizado.`,
          );
        }

        // Trava de Bloqueio Manual
        if (!wallet.canPurchaseAlone && buyerId === studentId) {
          throw new ForbiddenException(
            'Compra negada: Sua carteira está bloqueada para compras autônomas.',
          );
        }

        // Trava de Dias da Semana (Allowed Days)
        const dayOfWeek = new Date().getDay();
        if (!wallet.allowedDays.includes(dayOfWeek)) {
          throw new BadRequestException(
            'A compra não é permitida para este aluno no dia de hoje.',
          );
        }

        // ETAPA 1.7: Consistência de Unidade e Cálculo de Valor
        const firstProduct = products[0];
        if (!firstProduct)
          throw new NotFoundException('Erro na listagem de produtos.');

        const firstCanteenId = firstProduct.canteenId;

        // [Sprint 3.5] Middleware de Horário (Operational Clock)
        // Busca configurações da Cantina para validar turno
        const canteen = await tx.canteen.findUnique({
          where: { id: firstCanteenId },
          select: { openingTime: true, closingTime: true, type: true }
        });

        if (canteen && canteen.type === 'COMMERCIAL') { // Apenas comercial bloqueia, merenda é livre/logística
          await this.validateOperationalHours(canteen.openingTime, canteen.closingTime);
        }

        const schoolId = wallet.user.schoolId;

        if (!schoolId) {
          throw new ForbiddenException(
            'O aluno não possui uma escola vinculada.',
          );
        }

        let totalAmount = 0;

        for (const item of items) {
          const product = products.find((p) => p.id === item.productId);

          // FIX: Tratamento explicativo para o TypeScript (possibly undefined)
          if (!product) {
            throw new NotFoundException(
              `Produto ${item.productId} não encontrado na base de dados.`,
            );
          }

          if (!product.isAvailable) {
            throw new BadRequestException(
              `O item "${product.name}" não está disponível no cardápio.`,
            );
          }
          if (product.canteenId !== firstCanteenId) {
            throw new BadRequestException(
              'Não é permitido misturar itens de cantinas diferentes no mesmo pedido.',
            );
          }

          const price = product.salePrice ?? product.price;
          totalAmount += Number(price) * item.quantity;
        }

        // ETAPA 2: Reserva de Estoque
        await this.stockService.reserveProductsInTransaction(
          tx,
          items,
          firstCanteenId,
        );

        // ETAPA 3: Criação do Pedido (Status: PENDING)
        const orderHash = `AMBRA-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
        const order = await tx.order.create({
          data: {
            buyerId,
            studentId,
            totalAmount,
            status: OrderStatus.PENDING,
            orderHash,
            scheduledFor: scheduledDate, // [v4.1] Pre-order persistence
            schoolId: schoolId, // FIX: Garantido pela validação na Etapa 1.7
            items: {
              create: items.map((item) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product)
                  throw new NotFoundException(
                    `Falha de integridade no item ${item.productId}`,
                  );

                return {
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPrice: product.salePrice ?? product.price,
                };
              }),
            },
          },
        });

        // ETAPA 4: Débito Financeiro
        await this.transactionService.debitFromWalletForOrderInTransaction(tx, {
          buyerId,
          studentId,
          totalAmount,
          orderId: order.id,
        });

        // ETAPA 5: Finalização e Confirmação de Reserva (Baixa de Estoque)
        const finalPaidOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID },
          include: {
            items: { include: { product: true } },
            student: { select: { name: true } },
          },
        });

        // [v4.0.3] Fix: Decrementa stock real ao confirmar pagamento.
        await this.stockService.confirmSaleInTransaction(
          tx,
          finalPaidOrder.id,
          items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          firstCanteenId,
        );

        // ETAPA 6: Auditoria Industrial
        await this.auditService.logAction(tx, {
          userId: buyerId,
          action: 'ORDER_PROCESS_COMPLETED',
          entity: 'Order',
          entityId: finalPaidOrder.id,
          meta: { totalAmount, orderHash: finalPaidOrder.orderHash },
        });

        return finalPaidOrder;
      },
      { isolationLevel: 'Serializable', timeout: 15000 },
    );

    // ETAPA 7: Notificação em Tempo Real
    try {
      this.notificationsGateway.notifyNewOrder(paidOrder.schoolId, paidOrder);
    } catch (error: any) {
      this.logger.error(
        `WebSocket Fail: Pedido ${paidOrder.id} processado, mas notificação falhou.`,
        error.stack || error,
      );
    }

    return paidOrder;
  }

  /**
   * Validação de Restrições Parentais (Camada Food Domain)
   */
  private async checkRestrictions(
    tx: Prisma.TransactionClient,
    studentId: string,
    items: CreateOrderItemDto[],
    products: Product[],
  ) {
    const [prodRest, catRest] = await Promise.all([
      tx.productRestriction.findMany({ where: { userId: studentId } }),
      tx.categoryRestriction.findMany({ where: { userId: studentId } }),
    ]);

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      // FIX: Tratamento para o TypeScript garantir que o produto existe antes de checar propriedades
      if (!product) {
        throw new NotFoundException(
          `Produto ${item.productId} não identificado para validação de restrições.`,
        );
      }

      if (prodRest.some((r) => r.productId === product.id)) {
        throw new ForbiddenException(
          `Bloqueio Parental: O consumo de "${product.name}" não é permitido.`,
        );
      }

      if (catRest.some((r) => r.category === product.category)) {
        throw new ForbiddenException(
          `Bloqueio Parental: A categoria "${product.category}" está restrita para este aluno.`,
        );
      }
    }
  }

  /**
   * Lista pedidos com filtros de RLS (Row Level Security) e Paginação Opcional
   */
  async findAll(
    schoolId: string,
    filters?: {
      studentId?: string;
      buyerId?: string;
      status?: OrderStatus;
      startDate?: Date;
      endDate?: Date;
      canteenId?: string; // Para Canteen Operators filtrarem apenas sua cantina
    },
  ) {
    const where: Prisma.OrderWhereInput = {
      schoolId, // RLS Mandatório
    };

    if (filters) {
      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.buyerId) where.buyerId = filters.buyerId;
      if (filters.status) where.status = filters.status;

      // Filtro de Cantina (via relacionamentos dos items, simplificado aqui por School scope,
      // mas idealmente filtraria se order tem items daquela canteen)
      // Como o Order agora tem items de uma unica cantina (regra da create),
      // poderiamos filtrar pelos Items -> Product -> Canteen.
      if (filters.canteenId) {
        where.items = {
          some: {
            product: {
              canteenId: filters.canteenId,
            },
          },
        };
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } }, // Otimização
          },
        },
        student: { select: { id: true, name: true } },
      },
      take: 100, // Limite de segurança
    });
  }

  /**
   * Busca detalhada de um pedido
   */
  async findOne(id: string, schoolId?: string, userId?: string) {
    const baseWhere: Prisma.OrderWhereInput = { id };
    if (schoolId) baseWhere.schoolId = schoolId;

    if (userId) {
      // ELITE SECURITY: SQL-Level Deep Check
      // User can see order IF:
      // 1. Is the Buyer OR
      // 2. Is the Student target OR
      // 3. Is a Guardian of the Student
      baseWhere.OR = [
        { buyerId: userId },
        { studentId: userId },
        {
          student: {
            guardianRelations: {
              some: { guardianId: userId },
            },
          },
        },
      ];
    }

    const order = await this.prisma.order.findFirst({
      where: baseWhere,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        student: { select: { name: true, role: true } },
        buyer: { select: { name: true } },
        transactions: { select: { id: true, status: true, type: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado ou acesso negado.');
    }

    return order;
  }

  /**
   * Atualiza Status do Pedido (Fluxo da Cantina)
   */
  async updateStatus(
    id: string,
    status: OrderStatus,
    schoolId: string,
    userId: string,
  ) {
    // Busca prévia para validação RLS
    const order = await this.findOne(id, schoolId);

    // Regras de Transição de Estado
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível alterar pedidos cancelados.',
      );
    }

    if (
      order.status === OrderStatus.DELIVERED &&
      status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Pedidos entregues não podem regressar de status.',
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined,
      },
    });

    // Auditoria
    await this.auditService.logAction(this.prisma, {
      userId,
      action: `ORDER_UPDATE_${status}`,
      entity: 'Order',
      entityId: id,
      schoolId,
      meta: { previousStatus: order.status, newStatus: status },
    });

    return updatedOrder;
  }
  /**
   * Valida vínculo de Tutela (Guardian -> Student)
   */
  /**
   * Valida horário de funcionamento com fuso America/Sao_Paulo.
   * Formato esperado: "HH:mm" (Ex: "07:00", "18:00")
   */
  private async validateOperationalHours(openTime: string, closeTime: string) {
    const { formatInTimeZone } = await import('date-fns-tz');

    const TIMEZONE = 'America/Sao_Paulo';
    const now = new Date();

    // Obtém hora atual no fuso correto (HH:mm) para comparação simples de strings
    // Ex: "2023-10-05 14:30:00" -> "14:30"
    const currentHm = formatInTimeZone(now, TIMEZONE, 'HH:mm');

    if (currentHm < openTime || currentHm > closeTime) {
      throw new ForbiddenException(
        `Vendas Bloqueadas: A cantina opera entre ${openTime} e ${closeTime}. (Hora atual: ${currentHm})`
      );
    }
  }
}
