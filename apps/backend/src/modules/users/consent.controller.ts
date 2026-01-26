import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import { Request } from 'express';

@ApiTags('Compliance & Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly usersService: UsersService) {}

  @Post('terms')
  @UseInterceptors(AuditInterceptor)
  @Audit('ACCEPT_TERMS', 'User')
  @ApiOperation({ summary: 'Registra o aceite dos termos de uso (LGPD).' })
  @ApiResponse({ status: 201, description: 'Termos aceitos com sucesso.' })
  async acceptTerms(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body('version') version: string,
    @Req() req: Request,
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.usersService.acceptTerms(user.id, version, ip, userAgent);
  }
}
