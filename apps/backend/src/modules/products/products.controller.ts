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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CacheTTL } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';
import { TenantCacheInterceptor } from '../../common/interceptors/tenant-cache.interceptor';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
@UseInterceptors(TenantCacheInterceptor) // Cache ativado com isolamento de Tenant
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @UseInterceptors(AuditInterceptor)
  @Audit('CREATE_PRODUCT', 'Product')
  @ApiOperation({
    summary: 'Cadastra um novo produto no inventário da cantina.',
  })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso.' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    return this.productsService.create(
      createProductDto,
      user.schoolId!,
      user.canteenId || undefined,
    );
  }

  @Get()
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.MERCHANT_ADMIN,
    UserRole.OPERATOR_SALES,
    UserRole.GUARDIAN,
    UserRole.STUDENT,
  )
  @ApiOperation({
    summary:
      'Lista cardápio disponível (Filtra por disponibilidade para alunos).',
  })
  @CacheTTL(30000) // 30 segundos de cache para o cardápio
  async findAll(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.productsService.findAll(user.schoolId!, user.canteenId);
  }

  @Get('stock-alerts')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @ApiOperation({
    summary: '[v4.5] Retorna produtos com estoque crítico ou baixo.',
    description: 'Critical: stock = 0, Warning: stock > 0 && stock <= minStockAlert',
  })
  @ApiResponse({
    status: 200,
    description: 'Alertas de estoque retornados.',
    schema: {
      example: {
        critical: [
          { id: '...', name: 'Coca-Cola', stock: 0, minStockAlert: 10 }
        ],
        warning: [
          { id: '...', name: 'Suco', stock: 5, minStockAlert: 10 }
        ]
      }
    }
  })
  async getStockAlerts(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.productsService.getStockAlerts(user.schoolId!, user.canteenId);
  }

  @Get(':id')

  @ApiOperation({ summary: 'Detalhes de um produto específico.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @UseInterceptors(AuditInterceptor)
  @Audit('UPDATE_PRODUCT', 'Product')
  @ApiOperation({ summary: 'Atualiza dados ou preço do produto.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/stock')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @UseInterceptors(AuditInterceptor)
  @Audit('UPDATE_STOCK', 'Product')
  @ApiOperation({ summary: 'Ajuste rápido de stock físico.' })
  async updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('change') change: number,
  ) {
    return this.productsService.updateStock(id, change);
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.OPERATOR_SALES, UserRole.OPERATOR_MEAL)
  @UseInterceptors(AuditInterceptor)
  @Audit('DELETE_PRODUCT', 'Product')
  @ApiOperation({ summary: 'Remove produto (Soft Delete).' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
