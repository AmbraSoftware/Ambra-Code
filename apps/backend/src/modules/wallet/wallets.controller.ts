import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { UpdateWalletLimitsDto } from './dto/update-wallet-limits.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletsController {
  constructor(private readonly walletService: WalletService) {}

  @Patch(':walletId/limits')
  @Roles('SUPER_ADMIN', 'SCHOOL_ADMIN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('WALLET_LIMITS_UPDATED', 'Wallet')
  @ApiOperation({
    summary: '[P1] Atualiza limites da carteira (SOS Merenda / Limite diário).',
  })
  @ApiResponse({ status: 200, description: 'Limites atualizados com sucesso.' })
  async updateLimits(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('walletId', ParseUUIDPipe) walletId: string,
    @Body() dto: UpdateWalletLimitsDto,
  ) {
    return this.walletService.updateLimits(user, walletId, dto);
  }
}
