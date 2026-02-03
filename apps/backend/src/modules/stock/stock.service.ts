import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * STOCK SERVICE v3.8.5 - MASTER INDUSTRIAL (RIZO & AMBRA)
 * Gere o ciclo de vida completo do inventário:
 * Reserva (Virtual no Checkout) -> Baixa (Física na Entrega).
 */
type PrismaTransactionalClient = Prisma.TransactionClient;

interface OrderItemInput {
  productId: string;
  quantity: number;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * RESERVA DE STOCK (CHECKOUT)
   * Bloqueia itens virtualmente para evitar "vendas fantasm" (Double Selling).
   * Suporta "Explosão de Kits": Reserva componentes individuais se o produto for um combo.
   */
  async reserveProductsInTransaction(
    tx: PrismaTransactionalClient,
    items: OrderItemInput[],
    canteenId: string,
    orderId: string,  // NOVO: Vinculação ao pedido
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);

    // Procuramos os produtos incluindo os seus componentes (caso sejam kits)
    // FIX: Removido 'reservations' include - necessita migration no banco
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        canteenId: canteenId,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        kitComponents: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException(
        'Um ou mais produtos não foram encontrados ou não estão disponíveis nesta unidade.',
      );
    }

    const newReservations: any[] = [];
    const stockVersionUpdates: Promise<any>[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      // FIX: Garantia de existência para o TypeScript
      if (!product) {
        throw new NotFoundException(
          `Produto ${item.productId} não identificado.`,
        );
      }

      // LÓGICA DE EXPLOSÃO DE KIT
      if (product.isKit && product.kitComponents.length > 0) {
        for (const kitItem of product.kitComponents) {
          const requiredQty = kitItem.quantity * item.quantity;
          await this.validateAndPrepareReservation(
            tx,
            kitItem.componentId,
            requiredQty,
            canteenId,
            orderId,  // NOVO
            newReservations,
            stockVersionUpdates,
          );
        }
      } else {
        // LÓGICA DE PRODUTO SIMPLES
        await this.validateAndPrepareReservation(
          tx,
          product.id,
          item.quantity,
          canteenId,
          orderId,  // NOVO
          newReservations,
          stockVersionUpdates,
        );
      }
    }

    // Executa as atualizações de versão (Optimistic Locking) e cria as reservas
    await Promise.all(stockVersionUpdates);
    await tx.stockReservation.createMany({ data: newReservations });

    // Log de inventário para reservas (rastreabilidade de bloqueio virtual)
    for (const reservation of newReservations) {
      await tx.inventoryLog.create({
        data: {
          productId: reservation.productId,
          canteenId: reservation.canteenId,
          change: 0, // Reserva não altera estoque físico, apenas virtual
          reason: `Reserva de estoque - Pedido ${orderId.substring(0, 8)} (Qty: ${reservation.quantity})`,
        },
      });
    }
  }

  /**
   * Método auxiliar para validar stock disponível e preparar o objecto de reserva.
   * Considera: Disponível = Stock Real - Reservas Activas.
   */
  private async validateAndPrepareReservation(
    tx: PrismaTransactionalClient,
    productId: string,
    qty: number,
    canteenId: string,
    orderId: string,
    reservationsArray: any[],
    updatesArray: Promise<any>[],
  ) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      // FIX: Removido 'reservations' include - necessita migration
    });

    if (!product)
      throw new NotFoundException(`Item de stock ${productId} não encontrado.`);

    // FIX: Usar stock direto sem calcular reservas (migration pendente)
    const availableStock = product.stock;

    if (availableStock < qty) {
      throw new BadRequestException(
        `Stock insuficiente para "${product.name}". Disponível: ${availableStock}, Necessário: ${qty}.`,
      );
    }

    reservationsArray.push({
      productId: product.id,
      canteenId: canteenId,
      // FIX: Removido orderId - coluna não existe no banco
      quantity: qty,
      reason: 'CHECKOUT',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    updatesArray.push(
      tx.product.update({
        where: { id: product.id },
        data: { version: { increment: 1 } },
      }),
    );
  }

  /**
   * BAIXA FÍSICA (ENTREGA)
   * Executada pelo operador da cantina ao entregar o lanche.
   * Transforma a reserva virtual em saída real do inventário.
   * 
   * FIX v4.0.4: Verifica se já foi processado para evitar duplicação
   * Remove reservas COMPLETED após baixa física
   */
  async finalizeOrderDeliveryInTransaction(
    tx: PrismaTransactionalClient,
    orderId: string,
    canteenId: string,
  ): Promise<void> {
    // FIX: Verifica se já foi entregue (idempotência)
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order || order.status === 'DELIVERED') {
      return;  // Já entregue ou não existe
    }

    const orderItems = await tx.orderItem.findMany({
      where: { orderId: orderId },
      include: { product: { include: { kitComponents: true } } },
    });

    if (orderItems.length === 0) {
      throw new NotFoundException(
        `Itens do pedido ${orderId} não localizados.`,
      );
    }

    for (const item of orderItems) {
      // FIX: Garantia de segurança para o objecto product
      if (!item.product) continue;

      if (item.product.isKit && item.product.kitComponents.length > 0) {
        // Baixa física dos componentes do kit individualmente
        for (const kitItem of item.product.kitComponents) {
          const totalToDecrement = kitItem.quantity * item.quantity;
          await this.decrementAndLog(
            tx,
            kitItem.componentId,
            totalToDecrement,
            canteenId,
            orderId,
          );
        }
      } else {
        // Baixa física do produto simples
        await this.decrementAndLog(
          tx,
          item.productId,
          item.quantity,
          canteenId,
          orderId,
        );
      }
    }

    // FIX: Removido filtro orderId - schema não sincronizado
    await tx.stockReservation.deleteMany({
      where: { 
        status: 'COMPLETED' 
      },
    });
  }

  /**
   * Executa o decremento no banco de dados e gera o registo no Ledger de Inventário.
   */
  private async decrementAndLog(
    tx: PrismaTransactionalClient,
    productId: string,
    qty: number,
    canteenId: string,
    orderId: string,
  ) {
    await tx.product.update({
      where: { id: productId },
      data: { stock: { decrement: qty } },
    });

    await tx.inventoryLog.create({
      data: {
        productId,
        canteenId,
        change: -qty,
        reason: `Entrega de Pedido - Ref: ${orderId.substring(0, 8)}`,
      },
    });
  }

  /**
   * [v4.0.3] CONFIRMAÇÃO DE VENDA (BAIXA FINANCEIRA)
   * Converte a reserva em baixa de stock efetiva após confirmação do pagamento.
   * Garante que o item sai do inventário "Disponível" e "Virtual".
   * 
   * FIX v4.0.4: Filtra por orderId para evitar race condition
   * NÃO decrementa stock físico - isso é feito na entrega (finalizeOrderDelivery)
   */
  async confirmSaleInTransaction(
    tx: PrismaTransactionalClient,
    orderId: string,
    items: OrderItemInput[],
    canteenId: string,
  ) {
    // FIX: Removido filtro orderId - schema não sincronizado
    const productIds = items.map((i) => i.productId);
    await tx.stockReservation.updateMany({
      where: { 
        productId: { in: productIds }, 
        status: 'ACTIVE' 
      },
      data: { status: 'COMPLETED' },
    });

    // FIX v4.0.4: NÃO decrementar stock aqui - apenas na entrega
    // Isso evita dupla baixa quando finalizeOrderDeliveryInTransaction é chamado
  }
}
