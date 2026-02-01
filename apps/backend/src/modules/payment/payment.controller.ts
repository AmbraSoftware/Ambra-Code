import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import { CreateRechargeDto } from './dto/create-recharge.dto';
import { RequestRefundDto } from './dto/request-refund.dto';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('recharge-request')
  @Roles('GUARDIAN', 'STUDENT')  // ✅ Nova regra: Alunos 15+ também podem criar recargas
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Gera uma cobrança PIX para recarregar a carteira de um dependente ou própria (alunos 15+).',
  })
  @ApiResponse({ status: 200, description: 'Cobrança PIX gerada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  async requestRecharge(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() createRechargeDto: CreateRechargeDto,
  ) {
    return this.paymentService.generatePixRecharge(user.id, createRechargeDto);
  }

  @Post('pix-recharge')
  @Roles('GUARDIAN', 'STUDENT')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async pixRechargeAlias(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() createRechargeDto: CreateRechargeDto,
  ) {
    return this.paymentService.generatePixRecharge(user.id, createRechargeDto);
  }

  @Post('refund-request')
  @Roles('GUARDIAN', 'STUDENT')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[P1] Solicita reembolso de saldo (cria RefundRequest + REFUND_LOCK).',
  })
  @ApiResponse({ status: 200, description: 'Solicitação criada com sucesso.' })
  async requestRefund(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: RequestRefundDto,
  ) {
    return this.paymentService.requestRefund(user.id, dto);
  }
}
