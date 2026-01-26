import { Controller, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('guardian/premium')
  @ApiOperation({ summary: 'Simula a assinatura do plano Premium (Ambra Food)' })
  async subscribePremium(@Req() req, @Body() body: { planId?: string }) {
    const userId = req.user.id;

    // 1. Find Premium Plan
    const premiumPlan = await this.prisma.plan.findFirst({
      where: { target: 'GUARDIAN_PREMIUM', status: 'ACTIVE' }
    });

    if (!premiumPlan) {
      throw new BadRequestException('Plano Premium não disponível no momento.');
    }

    // 2. Assign to User (Mock Payment for now)
    // In real world, this would call Asaas Subscription API
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlanId: premiumPlan.id,
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1)) // +1 Month
      }
    });

    return {
      status: 'SUCCESS',
      message: 'Assinatura Premium ativada com sucesso!',
      plan: premiumPlan.name,
      expiresAt: updatedUser.subscriptionExpiresAt
    };
  }
}
