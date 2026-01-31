import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavoriteProductIds(params: { userId: string; schoolId: string }) {
    const favorites = await this.prisma.favorite.findMany({
      where: {
        userId: params.userId,
        product: {
          schoolId: params.schoolId,
          deletedAt: null,
        },
      },
      select: {
        productId: true,
      },
    });

    return favorites.map((f) => f.productId);
  }

  async toggleFavorite(params: {
    userId: string;
    schoolId: string;
    productId: string;
  }): Promise<{ isFavorited: boolean }> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: params.productId,
        schoolId: params.schoolId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      throw new ForbiddenException('Produto não encontrado para esta escola.');
    }

    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: params.userId,
          productId: params.productId,
        },
      },
      select: { userId: true },
    });

    if (existing) {
      await this.prisma.favorite.delete({
        where: {
          userId_productId: {
            userId: params.userId,
            productId: params.productId,
          },
        },
      });

      return { isFavorited: false };
    }

    try {
      await this.prisma.favorite.create({
        data: {
          userId: params.userId,
          productId: params.productId,
        },
      });

      return { isFavorited: true };
    } catch (e: any) {
      throw new BadRequestException('Não foi possível favoritar este produto.');
    }
  }
}
