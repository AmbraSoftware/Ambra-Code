import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TenancyService } from './tenancy.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

/**
 * TENANCY CONTROLLER v3.8.1 - MASTER INDUSTRIAL
 * Este controller é a "Central de Comando" do SaaS.
 * Apenas o Global Admin tem permissão para acessar estas rotas.
 */
@ApiTags('Tenancy (Global Management)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('tenancy')
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Post('schools')
  @Roles('SUPER_ADMIN') // Proteção nível 101% - Apenas o Super User
  @ApiOperation({
    summary: 'Inaugura uma nova escola no SaaS.',
    description:
      'Cria o Tenant isolado, o Administrador da escola e vincula a carteira financeira inicial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Escola e gestor criados com sucesso em transação atômica.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito: CNPJ ou Slug já em uso.',
  })
  async create(@Body() dto: CreateSchoolDto) {
    return this.tenancyService.createSchoolWithAdmin(dto);
  }

  @Get('schools')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Lista todas as instituições do ecossistema.',
    description: 'Visão geral para faturamento e gestão do SaaS.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de escolas com contagem de usuários e planos.',
  })
  async findAll(@Query('status') status?: string) {
    return this.tenancyService.listAllSchools(status);
  }

  @Patch('schools/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Atualiza uma escola existente.',
    description:
      'Permite alterar nome, slug, plano, status e configurações de white-label.',
  })
  @ApiParam({ name: 'id', description: 'ID da escola' })
  @ApiResponse({
    status: 200,
    description: 'Escola atualizada com sucesso.',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.tenancyService.updateSchool(id, dto);
  }

  @Delete('schools/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Remove uma escola do ecossistema.',
    description:
      'Apenas escolas sem usuários ou pedidos podem ser removidas. Considere suspender ao invés de remover.',
  })
  @ApiParam({ name: 'id', description: 'ID da escola' })
  @ApiResponse({
    status: 200,
    description: 'Escola removida com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Escola possui usuários ou pedidos vinculados.',
  })
  async remove(@Param('id') id: string) {
    return this.tenancyService.deleteSchool(id);
  }

  @Get('governments')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'B2G: Lista todas as prefeituras e governos.',
  })
  async listGovernments() {
    return this.tenancyService.listGovernments();
  }

  @Post('governments')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Cadastra uma nova prefeitura/governo.' })
  async createGovernment(@Body() dto: any) {
    return this.tenancyService.createGovernment(dto);
  }

  @Patch('governments/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Atualiza dados de uma prefeitura.' })
  async updateGovernment(@Param('id') id: string, @Body() dto: any) {
    return this.tenancyService.updateGovernment(id, dto);
  }

  @Delete('governments/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove uma prefeitura do sistema.' })
  async removeGovernment(@Param('id') id: string) {
    return this.tenancyService.deleteGovernment(id);
  }
}
