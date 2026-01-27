import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Query,
  Param,
  ParseUUIDPipe,
  UseInterceptors,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from '@nodum/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import { UserRole, OrderStatus } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiOperation({ summary: 'Cria um novo pedido para um aluno' })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado e pago com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou saldo insuficiente.',
  })
  @ApiResponse({
    status: 403,
    description: 'Produto bloqueado pelas restrições parentais.',
  })
  @ApiResponse({
    status: 404,
    description: 'Produto ou carteira não encontrado.',
  })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    // O buyerId é extraído do token do usuário autenticado (o responsável).
    const buyerId = user.id;
    return this.ordersService.create(buyerId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista pedidos com filtros (RLS Ativo).' })
  async findAll(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query('studentId') studentId?: string,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters = {
      studentId:
        user.role === UserRole.GUARDIAN || user.role === UserRole.STUDENT
          ? undefined
          : studentId, // Guardians só veem os seus via RLS implícito ou filtro explícito validado? O service usa RLS por schoolId. Mas guardians precisam ver apenas os deles.
      // FIX: Preciso ajustar o findAll do service para filtrar por buyerId se for GUARDIAN/STUDENT.
      buyerId: user.role === UserRole.GUARDIAN ? user.id : undefined,
      studentIdSelf: user.role === UserRole.STUDENT ? user.id : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      canteenId: user.canteenId ?? undefined, // Operadores veem apenas pedidos da sua cantina (idealmente)
    };

    // Ajuste de filtro para Student/Guardian
    const serviceFilters: any = { ...filters };
    if (filters.studentIdSelf) serviceFilters.studentId = filters.studentIdSelf;
    delete serviceFilters.studentIdSelf;

    return this.ordersService.findAll(user.schoolId!, serviceFilters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de um pedido específico.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    // Passamos schoolId para garantir RLS e userId para Deep Check SQL
    // Se for Admin, não passamos userId para liberar visão global da escola.
    const isRegularUser =
      user.role === UserRole.GUARDIAN || user.role === UserRole.STUDENT;

    const order = await this.ordersService.findOne(
      id,
      user.schoolId!,
      isRegularUser ? user.id : undefined,
    );

    return order;
  }

  @Patch(':id/status')
  @Roles(UserRole.CANTEEN_OPERATOR, UserRole.SCHOOL_ADMIN)
  @UseInterceptors(AuditInterceptor)
  @Audit('UPDATE_ORDER_STATUS', 'Order')
  @ApiOperation({ summary: 'Atualiza o status do pedido (Canteen Flow).' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.ordersService.updateStatus(id, status, user.schoolId!, user.id);
  }
}
