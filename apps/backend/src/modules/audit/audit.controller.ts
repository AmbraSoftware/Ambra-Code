import {
  Controller,
  Get,
  Query,
  UseGuards,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Busca os logs de auditoria da escola com paginação.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs de auditoria retornados com sucesso.',
  })
  getSchoolLogs(@Query() paginationDto: PaginationQueryDto) {
    // A filtragem por schoolId é garantida pelo RLS no PrismaService.
    return this.auditService.getLogsForSchool(paginationDto);
  }

  @Get('global-recent')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Stream de auditoria global (últimos 50 eventos).' })
  async getGlobalRecentLogs() {
    return this.auditService.getGlobalRecentLogs();
  }

  @Get('verify-integrity')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Verifica a integridade da blockchain-style chain de logs de auditoria.',
    description:
      'Valida se todos os hashes HMAC estão corretos e se a chain não foi adulterada.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da verificação de integridade.',
    schema: {
      example: {
        isValid: true,
        totalLogs: 150,
        invalidLogs: [],
      },
    },
  })
  async verifyIntegrity(@CurrentUser() user: AuthenticatedUserPayload) {
    // SUPER_ADMIN pode verificar qualquer escola, outros verificam a própria
    const schoolId = user.schoolId;

    if (!schoolId) {
      return {
        isValid: false,
        totalLogs: 0,
        invalidLogs: [],
        message: 'Usuário sem escola vinculada',
      };
    }

    return this.auditService.verifyAuditChainIntegrity(schoolId);
  }

  @Get('verify-integrity/:schoolId')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[SUPER ADMIN] Verifica integridade de logs de qualquer escola.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da verificação de integridade.',
  })
  async verifyIntegrityBySchool(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
  ) {
    return this.auditService.verifyAuditChainIntegrity(schoolId);
  }
}
