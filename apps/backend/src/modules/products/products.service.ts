import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ELITE SECURITY: Enforce Strict Canteen-School Ownership
   * Previne fishing de produtos de outras escolas.
   */
  private async validateCanteenOwnership(canteenId: string, schoolId: string) {
    const canteen = await this.prisma.canteen.findUnique({
      where: { id: canteenId },
      select: { schoolId: true },
    });

    if (!canteen || canteen.schoolId !== schoolId) {
      throw new ForbiddenException(
        'Acesso negado. Esta cantina não pertence à escola solicitada.',
      );
    }
  }

  async create(
    createProductDto: CreateProductDto,
    schoolId: string,
    canteenId?: string,
  ) {
    let targetCanteenId = canteenId;

    if (!targetCanteenId) {
      // Se não veio CanteenId (caso do Manager), pega a primeira da escola
      const defaultCanteen = await this.prisma.canteen.findFirst({
        where: { schoolId },
      });
      if (!defaultCanteen) {
        throw new NotFoundException(
          'Nenhuma cantina encontrada para esta escola.',
        );
      }
      targetCanteenId = defaultCanteen.id;
    }

    const canteen = await this.prisma.canteen.findFirst({
      where: { id: targetCanteenId, schoolId: schoolId },
    });

    if (!canteen) {
      throw new ForbiddenException(
        'A cantina especificada não pertence a esta escola.',
      );
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        canteenId: targetCanteenId,
        schoolId,
      },
    });
  }

  async findAll(schoolId: string, canteenId?: string | null) {
    const where: any = {
      schoolId, // Strict Tenant Isolation
      deletedAt: null,
    };

    if (canteenId) {
      // ELITE SECURITY CHECK
      await this.validateCanteenOwnership(canteenId, schoolId);
      where.canteenId = canteenId;
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * [v4.5] Alertas de Estoque - Ruptura e Estoque Baixo
   * O 'porquê': Permite que gestores identifiquem rapidamente produtos que precisam
   * de reposição, evitando rupturas que impactam vendas.
   *
   * @param schoolId - ID da escola (RLS)
   * @param canteenId - ID da cantina (opcional)
   * @returns Produtos críticos (stock=0) e em alerta (stock<=minStockAlert)
   */
  async getStockAlerts(schoolId: string, canteenId?: string | null) {
    const where: any = {
      schoolId,
      deletedAt: null,
    };

    if (canteenId) {
      await this.validateCanteenOwnership(canteenId, schoolId);
      where.canteenId = canteenId;
    }

    const products = await this.prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        stock: true,
        minStockAlert: true,
        imageUrl: true,
      },
      orderBy: { stock: 'asc' }, // Produtos com menos estoque primeiro
    });

    // Separar em critical (ruptura) e warning (estoque baixo)
    const critical = products.filter((p) => p.stock === 0);
    const warning = products.filter(
      (p) => p.stock > 0 && p.stock <= (p.minStockAlert || 10),
    );

    return {
      critical,
      warning,
      total: critical.length + warning.length,
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const { version, ...dataToUpdate } = updateProductDto;

    return this.prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({
          where: { id },
        });

        if (!product) {
          throw new NotFoundException(`Produto com ID ${id} não encontrado.`);
        }

        if (product.version !== version) {
          throw new ConflictException(
            'Este produto foi modificado por outro usuário. Por favor, atualize a página.',
          );
        }

        return tx.product.update({
          where: { id },
          data: {
            ...dataToUpdate,
            version: { increment: 1 },
          },
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * AJUSTE DE ESTOQUE v3.8.5 - INDUSTRIAL
   * 
   * FIX v4.0.4: Adicionada validação de schoolId para RLS
   */
  async updateStock(id: string, change: number, schoolId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new NotFoundException('Produto não encontrado.');
      
      // FIX: Validar se produto pertence à escola (RLS)
      if (schoolId && product.schoolId !== schoolId) {
        throw new ForbiddenException(
          'Acesso negado. Este produto não pertence à escola solicitada.',
        );
      }

      const updated = await tx.product.update({
        where: { id },
        data: {
          stock: { increment: change },
          version: { increment: 1 },
        },
      });

      await tx.inventoryLog.create({
        data: {
          productId: id,
          canteenId: product.canteenId,
          change,
          reason: 'Ajuste manual via Painel Administrativo',
        },
      });

      return updated;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
