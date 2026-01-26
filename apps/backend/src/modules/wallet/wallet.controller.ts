import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { RechargeDto } from './dto/recharge.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

/**
 * WALLET CONTROLLER v3.8.5 - RIZO PLATFORM
 * Gerencia operações de crédito e travas de segurança (Safety Switch).
 * Este controller está sincronizado com o WalletService para suporte multi-tenant.
 */
@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('recharge')
  @Roles(UserRole.GUARDIAN, UserRole.SCHOOL_ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_RECHARGE', 'Wallet')
  @ApiOperation({
    summary: 'Adiciona saldo à carteira de um dependente ou aluno.',
  })
  @ApiResponse({ status: 200, description: 'Recarga efetuada com sucesso.' })
  async recharge(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() rechargeDto: RechargeDto,
  ) {
    // FIX: Passamos o objeto 'user' completo para que o Service valide o vínculo multi-tenant
    return this.walletService.recharge(user, rechargeDto);
  }

  @Post('dependent/:dependentId/lock')
  @Roles(UserRole.GUARDIAN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_LOCK', 'Wallet')
  @ApiOperation({ summary: 'Bloqueia a carteira (Safety Switch).' })
  async lockWallet(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('dependentId', new ParseUUIDPipe()) dependentId: string,
  ) {
    // FIX: toggleLock agora recebe o objeto 'user' para validação de segurança
    return this.walletService.toggleLock(user, dependentId, true);
  }

  @Post('dependent/:dependentId/unlock')
  @Roles(UserRole.GUARDIAN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_UNLOCK', 'Wallet')
  @ApiOperation({ summary: 'Desbloqueia a carteira para compras.' })
  async unlockWallet(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('dependentId', new ParseUUIDPipe()) dependentId: string,
  ) {
    // FIX: toggleLock agora recebe o objeto 'user' para validação de segurança
    return this.walletService.toggleLock(user, dependentId, false);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consulta saldo e detalhes da carteira do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Dados da carteira retornados.' })
  async getMe(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.walletService.getWallet(user.id);
  }
}
