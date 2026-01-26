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
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);

    // Procuramos os produtos incluindo os seus componentes (caso sejam kits) e reservas activas
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        canteenId: canteenId,
        isAvailable: true,
        deletedAt: null,
      },
      include: {
        kitComponents: true,
        reservations: {
          where: { status: 'ACTIVE' },
        },
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
          newReservations,
          stockVersionUpdates,
        );
      }
    }

    // Executa as atualizações de versão (Optimistic Locking) e cria as reservas
    await Promise.all(stockVersionUpdates);
    await tx.stockReservation.createMany({ data: newReservations });
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
    reservationsArray: any[],
    updatesArray: Promise<any>[],
  ) {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { reservations: { where: { status: 'ACTIVE' } } },
    });

    if (!product)
      throw new NotFoundException(`Item de stock ${productId} não encontrado.`);

    const reservedStock = product.reservations.reduce(
      (acc, res) => acc + res.quantity,
      0,
    );
    const availableStock = product.stock - reservedStock;

    if (availableStock < qty) {
      throw new BadRequestException(
        `Stock insuficiente para "${product.name}". Disponível: ${availableStock}, Necessário: ${qty}.`,
      );
    }

    reservationsArray.push({
      productId: product.id,
      canteenId: canteenId,
      quantity: qty,
      reason: 'CHECKOUT',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Expira em 15 min
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
   */
  async finalizeOrderDeliveryInTransaction(
    tx: PrismaTransactionalClient,
    orderId: string,
    canteenId: string,
  ): Promise<void> {
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
   */
  async confirmSaleInTransaction(
    tx: PrismaTransactionalClient,
    orderId: string,
    items: OrderItemInput[],
    canteenId: string,
  ) {
    // 1. Mark reservations as COMPLETED
    const productIds = items.map((i) => i.productId);
    await tx.stockReservation.updateMany({
      where: { productId: { in: productIds }, status: 'ACTIVE' },
      data: { status: 'COMPLETED' },
    });

    // 2. Decrement Stock
    for (const item of items) {
      // Check for Kits (Re-fetch checking logic or assume validated)
      // Ideally we fetch product kit info again or assume the caller knows structure.
      // Since we are inside the same transaction as reserve, structure matches.
      // But to be safe and clean, reusing `decrementAndLog` logic requiring simpler inputs might be harder if we don't know if it is a kit.
      // So we should query product type or reuse logic.
      // Since we want to be safe:

      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: { kitComponents: true },
      });

      if (!product) continue;

      if (product.isKit && product.kitComponents.length > 0) {
        for (const kitItem of product.kitComponents) {
          await this.decrementAndLog(
            tx,
            kitItem.componentId,
            kitItem.quantity * item.quantity,
            canteenId,
            orderId,
          );
        }
      } else {
        await this.decrementAndLog(
          tx,
          item.productId,
          item.quantity,
          canteenId,
          orderId,
        );
      }
    }
  }
}
