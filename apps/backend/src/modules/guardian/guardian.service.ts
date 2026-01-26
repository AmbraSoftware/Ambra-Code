import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type PrismaTransactionalClient = Prisma.TransactionClient;

@Injectable()
export class GuardianService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDependents(guardianId: string) {
    const guardian = await this.prisma.user.findUnique({
      where: { id: guardianId },
      select: {
        dependentRelations: {
          select: {
            dependent: {
              select: {
                id: true,
                name: true,
                wallet: {
                  select: {
                    balance: true,
                  },
                },
                ordersAsStudent: {
                  take: 5,
                  orderBy: {
                    createdAt: 'desc',
                  },
                  select: {
                    id: true,
                    orderHash: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                    items: {
                      select: {
                        quantity: true,
                        product: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException('Responsável não encontrado.');
    }

    return guardian.dependentRelations.map((rel) => ({
      id: rel.dependent.id,
      name: rel.dependent.name,
      balance: rel.dependent.wallet?.balance ?? 0.0,
      lastOrders: rel.dependent.ordersAsStudent,
    }));
  }

  async getRestrictionsForDependent(guardianId: string, dependentId: string) {
    await this.validateDependent(this.prisma, guardianId, dependentId);
    return this.prisma.user.findUnique({
      where: { id: dependentId },
      select: {
        restrictedProducts: {
          include: { product: { select: { name: true } } },
        },
        restrictedCategories: true,
      },
    });
  }

  async addProductRestriction(
    guardianId: string,
    dependentId: string,
    productId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateDependent(tx, guardianId, dependentId);

      const existing = await tx.productRestriction.findFirst({
        where: { userId: dependentId, productId },
      });
      if (existing)
        throw new ConflictException('Este produto já está restringido.');

      const restriction = await tx.productRestriction.create({
        data: { userId: dependentId, productId },
      });
      await this.auditService.logAction(tx, {
        userId: guardianId,
        action: 'ADD_PRODUCT_RESTRICTION',
        entity: 'ProductRestriction',
        entityId: restriction.id,
        meta: { dependentId, productId },
      });
      return restriction;
    });
  }

  async removeProductRestriction(
    guardianId: string,
    dependentId: string,
    productId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateDependent(tx, guardianId, dependentId);
      const restriction = await tx.productRestriction.findFirst({
        where: { userId: dependentId, productId },
      });
      if (!restriction)
        throw new NotFoundException('Restrição de produto não encontrada.');

      await tx.productRestriction.delete({ where: { id: restriction.id } });
      await this.auditService.logAction(tx, {
        userId: guardianId,
        action: 'REMOVE_PRODUCT_RESTRICTION',
        entity: 'ProductRestriction',
        entityId: restriction.id,
        meta: { dependentId, productId },
      });
      return { message: 'Restrição de produto removida com sucesso.' };
    });
  }

  async addCategoryRestriction(
    guardianId: string,
    dependentId: string,
    category: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateDependent(tx, guardianId, dependentId);

      const existing = await tx.categoryRestriction.findFirst({
        where: { userId: dependentId, category },
      });
      if (existing)
        throw new ConflictException('Esta categoria já está restringida.');

      const restriction = await tx.categoryRestriction.create({
        data: { userId: dependentId, category },
      });
      await this.auditService.logAction(tx, {
        userId: guardianId,
        action: 'ADD_CATEGORY_RESTRICTION',
        entity: 'CategoryRestriction',
        entityId: restriction.id,
        meta: { dependentId, category },
      });
      return restriction;
    });
  }

  async removeCategoryRestriction(
    guardianId: string,
    dependentId: string,
    category: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.validateDependent(tx, guardianId, dependentId);
      const restriction = await tx.categoryRestriction.findFirst({
        where: { userId: dependentId, category },
      });
      if (!restriction)
        throw new NotFoundException('Restrição de categoria não encontrada.');

      await tx.categoryRestriction.delete({ where: { id: restriction.id } });
      await this.auditService.logAction(tx, {
        userId: guardianId,
        action: 'REMOVE_CATEGORY_RESTRICTION',
        entity: 'CategoryRestriction',
        entityId: restriction.id,
        meta: { dependentId, category },
      });
      return { message: 'Restrição de categoria removida com sucesso.' };
    });
  }

  private async validateDependent(
    tx: PrismaTransactionalClient | PrismaService,
    guardianId: string,
    dependentId: string,
  ) {
    const dependent = await tx.user.findFirst({
      where: {
        id: dependentId,
        guardianRelations: { some: { guardianId: guardianId } },
      },
    });
    if (!dependent) {
      throw new ForbiddenException(
        'Acesso negado. Este aluno não é seu dependente.',
      );
    }
  }
}
