import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkCreateUserDto } from './dto/bulk-create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import { CacheService } from '../../common/cache/cache.service';


@ApiTags('User Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cacheService: CacheService,
  ) { }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('CREATE_USER', 'User')
  @ApiOperation({
    summary: 'Cria um novo utilizador na escola (Aluno, Operador ou Admin).',
  })
  @ApiResponse({ status: 201, description: 'Utilizador criado com sucesso.' })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    // Invalidate Stats Cache
    const cacheKey = `student_stats:${user.schoolId || 'global'}`;
    this.cacheService.del(cacheKey);

    // Operator validation
    if (user.role === UserRole.OPERATOR_ADMIN && !user.canteenId) {
        throw new BadRequestException('Operador sem cantina vinculada não pode criar usuários.');
    }

    // Garantimos que o utilizador só cria membros para a sua própria escola
    return this.usersService.create(createUserDto, user.schoolId!);
  }

  @Post('bulk')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('BULK_CREATE_USERS', 'User')
  @ApiOperation({
    summary: 'Importação em massa de usuários (Partial Success).',
    description: 'Processa lista de usuários. Retorna relatório de sucessos e falhas. Ideal para CSV Import.',
  })
  async createBulk(
    @Body() bulkDto: BulkCreateUserDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.usersService.bulkCreate(bulkDto, user.schoolId!);
  }

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiOperation({
    summary: 'Lista todos os utilizadores da escola (Isolamento RLS ativo).',
    description: '[v4.5] Suporta filtros de auditoria: ?filter=negative_balance ou ?filter=inactive_30d',
  })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('role') role?: string,
    @Query('deleted') deleted?: string,
    @Query('filter') filter?: 'negative_balance' | 'inactive_30d', // [v4.5] Audit Filters
  ) {
    // Se for Global Admin, vê tudo (schoolId undefined), se não, vê só da escola
    const withDeleted = deleted === 'true';
    const roles = role ? (role.split(',') as UserRole[]) : undefined;
    return this.usersService.findAll(
      user.schoolId || undefined,
      roles,
      withDeleted,
      filter, // [v4.5] Pass filter to service
    );
  }

  @Get('stats')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiOperation({
    summary: '[v4.5] Retorna estatísticas de alunos para contadores de filtros.',
    description: 'Endpoint otimizado com cache de 60s para exibir contadores nos botões de filtro (Total, Saldo Negativo, Inativos 30d).',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso.',
    schema: {
      example: {
        total: 2200,
        negativeBalance: 12,
        inactive30d: 45,
      },
    },
  })
  async getStats(@CurrentUser() user: AuthenticatedUserPayload) {
    const cacheKey = `student_stats:${user.schoolId || 'global'}:${user.canteenId || 'all'}`;

    // Try to get from cache first
    const cached = this.cacheService.get<{
      total: number;
      negativeBalance: number;
      inactive30d: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // If not in cache, fetch from database
    const stats = await this.usersService.getStudentStats(user.schoolId || undefined);

    // Cache for 60 seconds
    this.cacheService.set(cacheKey, stats, 60000);

    return stats;
  }

  @Get('export-csv')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @ApiOperation({
    summary: '[v4.5] Exporta relatório financeiro em CSV com conformidade brasileira.',
    description: 'Gera CSV formatado para Excel BR (separador ;, fuso horário Brasília).',
  })
  async exportCSV(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res() res?: any,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const csv = await this.usersService.exportFinancialCSV(
      user.schoolId || undefined,
      start,
      end,
      user.canteenId || undefined
    );

    const today = new Date().toISOString().split('T')[0];
    const filename = `relatorio_financeiro_${today}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get(':id')

  @ApiOperation({ summary: 'Busca um utilizador específico por ID.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('UPDATE_USER', 'User')
  @ApiOperation({ summary: 'Atualiza dados de um utilizador.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('DELETE_USER', 'User')
  @ApiOperation({
    summary: 'Remove um utilizador (Soft Delete para integridade financeira).',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    const cacheKey = `student_stats:${user.schoolId || 'global'}:${user.canteenId || 'all'}`;
    this.cacheService.del(cacheKey);
    return this.usersService.remove(id);
  }

  @Delete(':id/permanent')
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiOperation({
    summary: 'Exclusão Permanente (Hard Delete). CUIDADO!',
  })
  async deletePermanently(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deletePermanently(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GLOBAL_ADMIN, UserRole.OPERATOR_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('RESTORE_USER', 'User')
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    const cacheKey = `student_stats:${user.schoolId || 'global'}:${user.canteenId || 'all'}`;
    this.cacheService.del(cacheKey);
    return this.usersService.restore(id);
  }

  @Post('invitations')
  @Roles(UserRole.GUARDIAN)
  @UseInterceptors(AuditInterceptor)
  @Audit('SEND_INVITATION', 'GuardianInvitation')
  @ApiOperation({
    summary: 'Envia convite para outro responsável (Fluxo Parental).',
  })
  async sendInvite(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body('email') email: string,
  ) {
    return this.usersService.inviteGuardian(user.id, email);
  }

  @Get('dependents')
  @Roles(UserRole.GUARDIAN)
  @ApiOperation({ summary: 'Lista os dependentes do responsável logado.' })
  async getDependents(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.usersService.findDependents(user.id);
  }
}
