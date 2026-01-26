import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

class BroadcastDto {
  title: string;
  message: string;
  targetRole?: UserRole; // Opcional: Se null, envia para todos da escola
}

@ApiTags('Notifications & Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('broadcast')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('SEND_BROADCAST', 'Notification')
  @ApiOperation({
    summary: 'Envia um aviso (Broadcast) para um grupo de utilizadores.',
  })
  @ApiBody({ type: BroadcastDto })
  @ApiResponse({ status: 201, description: 'Broadcast disparado com sucesso.' })
  async broadcast(
    @Body() dto: BroadcastDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    // Se for SCHOOL_ADMIN, força o schoolId dele.
    // Se for GLOBAL_ADMIN, poderia permitir schoolId opcional no DTO,
    // mas por segurança e simplicidade, vamos assumir o contexto atual.
    const schoolId = user.schoolId || undefined;

    const result = await this.notificationService.broadcast(
      { role: dto.targetRole, schoolId },
      { title: dto.title, message: dto.message },
    );

    return {
      message: 'Broadcast iniciado com sucesso.',
      targets: result.count,
    };
  }
}
