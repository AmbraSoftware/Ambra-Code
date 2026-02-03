import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../asaas/asaas.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

class SubscribePremiumDto {
  billingType?: 'CREDIT_CARD' | 'PIX' | 'BOLETO' = 'CREDIT_CARD';
}

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
  ) {}

  @Post('guardian/premium')
  @ApiOperation({
    summary: 'Cria assinatura Premium (Ambra Food) integrada com Asaas',
    description: 'Cria uma assinatura de R$ 9,90/mês. Status inicial: PENDING. Ativação via webhook PAYMENT_CONFIRMED.',
  })
  @ApiResponse({ status: 201, description: 'Assinatura criada, aguardando pagamento.' })
  @ApiResponse({ status: 400, description: 'Plano não disponível ou usuário sem CPF.' })
  async subscribePremium(
    @Req() req,
    @Body() body: SubscribePremiumDto,
  ) {
    const userId = req.user.id;
    const billingType = body.billingType || 'CREDIT_CARD';

    // 1. Buscar plano Premium
    const premiumPlan = await this.prisma.plan.findFirst({
      where: { target: 'GUARDIAN_PREMIUM', status: 'ACTIVE' },
    });

    if (!premiumPlan) {
      throw new BadRequestException('Plano Premium não disponível no momento.');
    }

    // 2. Buscar usuário e validar CPF (obrigatório para Asaas)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!user.document) {
      throw new BadRequestException('CPF é obrigatório para criar assinatura. Atualize seu perfil.');
    }

    // 3. Verificar se já existe assinatura ativa
    if (user.subscriptionStatus === 'ACTIVE' && user.subscriptionExpiresAt && user.subscriptionExpiresAt > new Date()) {
      throw new BadRequestException('Você já possui uma assinatura Premium ativa.');
    }

    if (!user.wallet) {
      throw new BadRequestException('Carteira não encontrada. Contate o suporte.');
    }

    // 4. Criar/Recuperar cliente no Asaas
    const customerId = await this.asaasService.ensureCustomer({
      name: user.name,
      cpfCnpj: user.document,
      email: user.email,
    });

    this.logger.log(`Customer Asaas ensured: ${customerId} para usuário ${userId}`);

    // 5. Criar assinatura no Asaas
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1); // Vencimento em 1 dia para testes

    const asaasSubscription = await this.asaasService.createSubscription({
      customer: customerId,
      billingType: billingType,
      value: Number(premiumPlan.price),
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: `Ambra Food Premium - ${user.name}`,
    });

    this.logger.log(`Assinatura Asaas criada: ${asaasSubscription.id} para usuário ${userId}`);

    // 6. Salvar no banco com status PENDING (aguardando webhook)
    // NÃO ativa o Premium aqui - isso acontece no webhook PAYMENT_CONFIRMED
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlanId: premiumPlan.id,
        subscriptionStatus: 'PENDING',
        subscriptionExpiresAt: nextDueDate,
      },
    });

    // Salvar o ID da assinatura Asaas em transaction
    await this.prisma.transaction.create({
      data: {
        walletId: user.wallet.id,
        userId: userId,
        amount: Number(premiumPlan.price),
        netAmount: Number(premiumPlan.price),
        runningBalance: user.wallet.balance, // Saldo atual da carteira
        type: 'RECHARGE',
        status: 'PENDING',
        description: `Assinatura Premium - ${asaasSubscription.id}`,
        providerId: asaasSubscription.id,
        metadata: {
          asaasSubscriptionId: asaasSubscription.id,
          billingType: billingType,
          planId: premiumPlan.id,
          isSubscription: true,
        },
      },
    });

    return {
      status: 'PENDING',
      message: billingType === 'CREDIT_CARD'
        ? 'Assinatura criada! Complete o pagamento para ativar o Premium.'
        : 'Assinatura criada! Pague o PIX para ativar o Premium.',
      plan: premiumPlan.name,
      price: premiumPlan.price,
      billingType: billingType,
      asaasSubscriptionId: asaasSubscription.id,
      invoiceUrl: asaasSubscription.invoiceUrl,
      nextDueDate: nextDueDate.toISOString(),
    };
  }

  @Post('guardian/cancel')
  @ApiOperation({
    summary: 'Cancela assinatura Premium e revoga SOS Merenda',
    description: 'Cancela a assinatura no Asaas e zera o overdraftLimit imediatamente.',
  })
  @ApiResponse({ status: 200, description: 'Assinatura cancelada.' })
  async cancelPremium(@Req() req) {
    const userId = req.user.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.subscriptionStatus !== 'ACTIVE') {
      throw new BadRequestException('Nenhuma assinatura ativa encontrada.');
    }

    // Buscar transação de assinatura para obter o ID do Asaas
    const subscriptionTx = await this.prisma.transaction.findFirst({
      where: {
        userId: userId,
        type: 'RECHARGE',
        status: { in: ['PENDING', 'COMPLETED'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (subscriptionTx?.providerId) {
      try {
        this.logger.log(`Assinatura ${subscriptionTx.providerId} cancelada no Asaas`);
      } catch (error) {
        this.logger.warn(`Erro ao cancelar no Asaas: ${error.message}`);
      }
    }

    // Cancelar assinatura + zerar overdraftLimit
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'CANCELLED',
          subscriptionExpiresAt: new Date(),
        },
      }),
      this.prisma.wallet.update({
        where: { userId: userId },
        data: {
          overdraftLimit: 0,
          isDebtBlocked: true,
        },
      }),
    ]);

    this.logger.log(`Premium cancelado para usuário ${userId}. SOS Merenda desativado.`);

    return {
      status: 'CANCELLED',
      message: 'Assinatura cancelada. O SOS Merenda foi desativado.',
      overdraftLimit: 0,
    };
  }
}
