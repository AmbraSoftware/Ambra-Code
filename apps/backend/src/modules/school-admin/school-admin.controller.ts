import { Controller, Get, UseGuards, Patch, Body } from '@nestjs/common';
import { SchoolAdminService } from './school-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { UpdateConfigDto } from './dto/update-config.dto';

@ApiTags('School Administration')
@ApiBearerAuth()
@Controller('school-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolAdminController {
  constructor(private readonly schoolAdminService: SchoolAdminService) { }

  @Get('dashboard/stats')
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Obtém as estatísticas do dia para o dashboard da escola.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  async getDashboardStats() {
    return this.schoolAdminService.getDashboardStats();
  }

  @Get('config')
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Obtém as configurações atuais da escola.',
  })
  async getSchoolConfig(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.schoolAdminService.getSchoolConfig(user.schoolId!);
  }

  @Patch('config')
  @Roles('SCHOOL_ADMIN')
  @ApiOperation({
    summary: 'Atualiza as configurações da escola (white-labeling).',
  })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso.',
  })
  @ApiResponse({
    status: 403,
    description: 'Funcionalidade não permitida pelo plano atual.',
  })
  async updateSchoolConfig(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() updateConfigDto: UpdateConfigDto,
  ) {
    return this.schoolAdminService.updateSchoolConfig(
      user.schoolId!,
      updateConfigDto,
    );
  }
}
