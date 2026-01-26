import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Guardian Invitations')
@ApiBearerAuth()
@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles('GUARDIAN')
  @ApiOperation({
    summary: 'Envia um convite para outro responsável compartilhar a tutela.',
  })
  @ApiResponse({ status: 201, description: 'Convite enviado com sucesso.' })
  create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() createInvitationDto: CreateInvitationDto,
  ) {
    return this.invitationsService.create(
      user.id,
      user.schoolId!,
      createInvitationDto,
    );
  }

  @Post(':id/accept')
  @Roles('GUARDIAN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceita um convite de tutela.' })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.invitationsService.accept(id, user.id);
  }

  @Post(':id/reject')
  @Roles('GUARDIAN')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AuditInterceptor)
  @Audit('REJECT_INVITATION', 'GuardianInvitation')
  @ApiOperation({ summary: 'Rejeita um convite de tutela.' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.invitationsService.reject(id, user.id);
  }

  @Get('my')
  @Roles('GUARDIAN')
  @ApiOperation({
    summary: 'Lista os convites enviados e recebidos pelo usuário.',
  })
  getMyInvitations(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.invitationsService.getMyInvitations(user.id);
  }
}
