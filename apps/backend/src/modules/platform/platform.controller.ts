import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { HealthService } from './health.service';
import { CreateSystemDto } from './dto/create-system.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';

@ApiTags('Platform (Global Admin Only)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@Controller('platform')
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly healthService: HealthService,
  ) {}

  @Get('health')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Monitoramento de Infraestrutura em Tempo Real' })
  async checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('search')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Omni-Search Global (Users, Schools, Transactions)',
  })
  async globalSearch(@Query('q') query: string) {
    return this.platformService.globalSearch(query);
  }

  @Post('systems')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Cadastra uma nova vertical de negócio (Ex: AMBRA)',
  })
  async create(@Body() dto: CreateSystemDto) {
    return this.platformService.createSystem(dto);
  }

  @Get('systems')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista todos os sistemas afiliados na plataforma' })
  async findAll() {
    return this.platformService.findAllSystems();
  }

  @Patch('systems/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza uma vertical de negócio existente' })
  @ApiParam({ name: 'id', description: 'ID do sistema' })
  async update(@Param('id') id: string, @Body() dto: UpdateSystemDto) {
    return this.platformService.updateSystem(id, dto);
  }

  @Delete('systems/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary:
      'Remove uma vertical de negócio (se não houver escolas vinculadas)',
  })
  @ApiParam({ name: 'id', description: 'ID do sistema' })
  async remove(@Param('id') id: string) {
    return this.platformService.deleteSystem(id);
  }

  @Get('plans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista todos os planos ativos' })
  async listPlans() {
    return this.platformService.listAllPlans();
  }

  @Post('plans')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cria um novo plano (SaaS ou B2C)' })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.platformService.createPlan(dto);
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Painel de Comando Estratégico (KPIs)' })
  async getDashboard() {
    return this.platformService.getDashboardStats();
  }

  /**
   * Obter detalhes de assinantes de um plano
   * Retorna lista de escolas que assinam o plano com métricas financeiras
   */
  @Get('plans/:id/subscribers')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detalhes de assinantes de um plano' })
  @ApiParam({ name: 'id', description: 'ID do plano' })
  async getSubscribers(@Param('id') planId: string) {
    return this.platformService.getPlanSubscribers(planId);
  }

  @Get('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obter detalhes de um plano' })
  async getPlan(@Param('id') id: string) {
    return this.platformService.findOnePlan(id);
  }

  @Patch('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualizar um plano' })
  async updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.platformService.updatePlan(id, dto);
  }
  // --- CICLO DE VIDA (Lifecycle Endpoints) ---

  // SYSTEMS
  @Patch('systems/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  async deactivateSystem(@Param('id') id: string) {
    return this.platformService.deactivateSystem(id);
  }

  @Patch('systems/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  async restoreSystem(@Param('id') id: string) {
    return this.platformService.restoreSystem(id);
  }

  // SCHOOLS
  @Patch('schools/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  async deactivateSchool(@Param('id') id: string) {
    return this.platformService.deactivateSchool(id);
  }

  @Patch('schools/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  async restoreSchool(@Param('id') id: string) {
    return this.platformService.restoreSchool(id);
  }

  // PLANS
  @Patch('plans/:id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  async deactivatePlan(@Param('id') id: string) {
    return this.platformService.deactivatePlan(id);
  }

  @Patch('plans/:id/restore')
  @Roles(UserRole.SUPER_ADMIN)
  async restorePlan(@Param('id') id: string) {
    return this.platformService.restorePlan(id);
  }

  // HARD DELETE & TRASH
  @Delete('systems/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async deleteSystem(@Param('id') id: string) {
    return this.platformService.deleteSystem(id);
  }

  @Delete('plans/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async deletePlan(@Param('id') id: string) {
    return this.platformService.deletePlan(id);
  }

  @Delete('trash')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Esvazia a lixeira (Remove itens inativos/deletados).',
  })
  async emptyTrash(@Query('type') type: string) {
    return this.platformService.emptyTrash(type);
  }
}
