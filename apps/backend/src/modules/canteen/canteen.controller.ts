import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  Body,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CanteenService } from './canteen.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Canteen Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('canteen')
export class CanteenController {
  constructor(private readonly canteenService: CanteenService) { }

  @Get('order/scan/:hash')
  @Roles(UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @ApiOperation({
    summary: 'Valida QR Code e busca detalhes do pedido para entrega.',
  })
  @ApiResponse({ status: 200, description: 'Pedido localizado e validado.' })
  @ApiResponse({ status: 404, description: 'QR Code inexistente.' })
  async getOrderByHash(
    @Param('hash') hash: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.canteenService.getOrderByHashForScan(hash, user.canteenId);
  }

  @Get('orders')
  @Roles(UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL, UserRole.SCHOOL_ADMIN)
  @ApiOperation({
    summary: 'Lista a fila de pedidos da cantina (Padrão: PAID).',
  })
  async getOrdersByStatus(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Query() query: OrderQueryDto,
  ) {
    return this.canteenService.getOrdersByStatus(user.canteenId, query.status);
  }

  @Post('orders/:orderId/deliver')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @UseInterceptors(AuditInterceptor)
  @Audit('DELIVER_ORDER', 'Order')
  @ApiOperation({
    summary: 'Confirma a entrega física, finalizando a reserva de stock.',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrega confirmada e stock atualizado.',
  })
  async deliverOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.canteenService.deliverOrder(orderId, user.canteenId);
  }

  // --- Management Endpoints ---

  @Get()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Lista todas as cantinas da escola.' })
  async findAll(@CurrentUser() user: AuthenticatedUserPayload) {
    if (!user.schoolId) throw new Error('User not attached to a school');
    return this.canteenService.findAll(user.schoolId);
  }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Cria uma nova cantina.' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() body: { name: string; type: 'COMMERCIAL' | 'GOVERNMENTAL' },
  ) {
    if (!user.schoolId) throw new Error('User not attached to a school');
    return this.canteenService.create(user.schoolId, body);
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Detalhes da cantina e seus operadores.' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    if (!user.schoolId) throw new Error('User not attached to a school');
    return this.canteenService.findOne(id, user.schoolId);
  }

  @Post(':id/operators')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Adiciona um operador à cantina.' })
  async addOperator(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() body: { name: string; email: string; passwordHash: string },
  ) {
    if (!user.schoolId) throw new Error('User not attached to a school');
    return this.canteenService.addOperator(id, user.schoolId, body);
  }

  @Delete(':id/operators/:operatorId')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Remove um operador da cantina.' })
  async removeOperator(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('operatorId', ParseUUIDPipe) operatorId: string,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    if (!user.schoolId) throw new Error('User not attached to a school');
    return this.canteenService.removeOperator(id, operatorId, user.schoolId);
  }

  // --- MERENDA IQ Endpoints ---

  @Post(':id/menu')
  @Roles(UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Define o cardápio do dia (Merenda).' })
  async setDailyMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { date: string; items: any; nutritionalInfo?: any },
  ) {
    return this.canteenService.createOrUpdateDailyMenu(
      id,
      new Date(body.date),
      body.items,
      body.nutritionalInfo,
    );
  }

  @Get(':id/menu')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.GUARDIAN, UserRole.STUDENT)
  @ApiOperation({ summary: 'Obtém o cardápio da semana.' })
  async getWeeklyMenu(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.canteenService.getWeeklyMenu(
      id,
      new Date(start),
      new Date(end),
    );
  }
}
