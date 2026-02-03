import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  CouponResponseDto,
  CouponStatus,
  CouponAudience,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
    // Validar código único
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Cupom com código ${dto.code} já existe.`);
    }

    // Validar planId se fornecido
    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });

      if (!plan) {
        throw new NotFoundException(`Plano ${dto.planId} não encontrado.`);
      }

      // Validar que o plano corresponde ao público
      if (
        dto.audience === CouponAudience.B2B &&
        plan.target !== 'SCHOOL_SAAS'
      ) {
        throw new BadRequestException(
          'Cupom B2B deve estar vinculado a um plano SCHOOL_SAAS.',
        );
      }

      if (
        dto.audience === CouponAudience.B2C &&
        plan.target !== 'GUARDIAN_PREMIUM'
      ) {
        throw new BadRequestException(
          'Cupom B2C deve estar vinculado a um plano GUARDIAN_PREMIUM.',
        );
      }
    }

    // Validar valor
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException(
        'Desconto percentual não pode ser maior que 100%.',
      );
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        audience: dto.audience,
        planId: dto.planId || null,
        validUntil: new Date(dto.validUntil),
        maxUses: dto.maxUses || null,
        usedCount: 0,
        status: CouponStatus.ACTIVE,
      },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type as any,
      value: coupon.value,
      audience: coupon.audience as any,
      planId: coupon.planId ?? undefined,
      planName: coupon.plan?.name,
      validUntil: coupon.validUntil,
      maxUses: coupon.maxUses ?? undefined,
      usedCount: coupon.usedCount,
      status: coupon.status as any,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }

  async findAll(): Promise<CouponResponseDto[]> {
    const coupons = await this.prisma.coupon.findMany({
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return coupons.map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type as any,
      value: coupon.value,
      audience: coupon.audience as any,
      planId: coupon.planId ?? undefined,
      planName: coupon.plan?.name,
      validUntil: coupon.validUntil,
      maxUses: coupon.maxUses ?? undefined,
      usedCount: coupon.usedCount,
      status: coupon.status as any,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    }));
  }

  async findOne(id: string): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Cupom ${id} não encontrado.`);
    }

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type as any,
      value: coupon.value,
      audience: coupon.audience as any,
      planId: coupon.planId ?? undefined,
      planName: coupon.plan?.name,
      validUntil: coupon.validUntil,
      maxUses: coupon.maxUses ?? undefined,
      usedCount: coupon.usedCount,
      status: coupon.status as any,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Cupom ${id} não encontrado.`);
    }

    // Validar código único se estiver sendo alterado
    if (dto.code && dto.code.toUpperCase() !== coupon.code) {
      const existing = await this.prisma.coupon.findUnique({
        where: { code: dto.code.toUpperCase() },
      });

      if (existing) {
        throw new ConflictException(`Cupom com código ${dto.code} já existe.`);
      }
    }

    // Validar planId se fornecido
    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });

      if (!plan) {
        throw new NotFoundException(`Plano ${dto.planId} não encontrado.`);
      }
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.toUpperCase() : undefined,
        type: dto.type,
        value: dto.value,
        audience: dto.audience,
        planId: dto.planId !== undefined ? dto.planId : undefined,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        maxUses: dto.maxUses !== undefined ? dto.maxUses : undefined,
        status: dto.status,
      },
      include: {
        plan: {
          select: {
            name: true,
          },
        },
      },
    });

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Cupom ${id} não encontrado.`);
    }

    await this.prisma.coupon.delete({ where: { id } });
  }

  /**
   * Valida e aplica um cupom a uma compra
   */
  async validateAndApplyCoupon(
    code: string,
    amount: number,
    planId?: string,
    audience?: CouponAudience,
  ) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException('Cupom não encontrado.');
    }

    // Validar status
    if (coupon.status !== CouponStatus.ACTIVE) {
      throw new BadRequestException('Cupom não está ativo.');
    }

    // Validar validade
    if (new Date() > coupon.validUntil) {
      throw new BadRequestException('Cupom expirado.');
    }

    // Validar usos
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new BadRequestException('Cupom atingiu o limite de usos.');
    }

    // Validar público
    if (audience && coupon.audience !== audience) {
      throw new BadRequestException(
        'Cupom não é válido para este tipo de usuário.',
      );
    }

    // Validar plano
    if (coupon.planId && coupon.planId !== planId) {
      throw new BadRequestException('Cupom não é válido para este plano.');
    }

    // Calcular desconto
    const discount =
      coupon.type === 'PERCENTAGE'
        ? (amount * coupon.value) / 100
        : coupon.value;

    const finalAmount = Math.max(0, amount - discount);

    // Incrementar contador de uso
    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: coupon.usedCount + 1 },
    });

    return {
      couponCode: coupon.code,
      originalAmount: amount,
      discount,
      finalAmount,
    };
  }
}
