import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SetProductRestrictionDto } from './dto/set-product-restriction.dto';
import { SetCategoryRestrictionDto } from './dto/set-category-restriction.dto';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { Audit } from '../../common/decorators/audit.decorator';

@ApiTags('Guardian')
@ApiBearerAuth()
@Controller('guardian')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuardianController {
  constructor(private readonly guardianService: GuardianService) {}

  @Get('dependents')
  @Roles('GUARDIAN')
  @ApiOperation({
    summary:
      'Obtém a lista de dependentes do responsável logado, com saldo e últimos pedidos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de dependentes retornada com sucesso.',
  })
  async getDependents(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.guardianService.getDependents(user.id);
  }

  @Get('dependents/:dependentId/restrictions')
  @Roles('GUARDIAN')
  @ApiOperation({
    summary: 'Obtém as restrições de produtos e categorias de um dependente.',
  })
  async getRestrictions(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('dependentId', ParseUUIDPipe) dependentId: string,
  ) {
    return this.guardianService.getRestrictionsForDependent(
      user.id,
      dependentId,
    );
  }

  @Post('restrictions/product')
  @Roles('GUARDIAN')
  @UseInterceptors(AuditInterceptor)
  @Audit('ADD_PRODUCT_RESTRICTION', 'ProductRestriction')
  @ApiOperation({
    summary: 'Adiciona uma restrição de produto para um dependente.',
  })
  async addProductRestriction(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SetProductRestrictionDto,
  ) {
    return this.guardianService.addProductRestriction(
      user.id,
      dto.dependentId,
      dto.productId,
    );
  }

  @Delete('restrictions/product')
  @Roles('GUARDIAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma restrição de produto de um dependente.',
  })
  async removeProductRestriction(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SetProductRestrictionDto,
  ) {
    return this.guardianService.removeProductRestriction(
      user.id,
      dto.dependentId,
      dto.productId,
    );
  }

  @Post('restrictions/category')
  @Roles('GUARDIAN')
  @UseInterceptors(AuditInterceptor)
  @Audit('ADD_CATEGORY_RESTRICTION', 'CategoryRestriction')
  @ApiOperation({
    summary: 'Adiciona uma restrição de categoria para um dependente.',
  })
  async addCategoryRestriction(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SetCategoryRestrictionDto,
  ) {
    return this.guardianService.addCategoryRestriction(
      user.id,
      dto.dependentId,
      dto.category,
    );
  }

  @Delete('restrictions/category')
  @Roles('GUARDIAN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma restrição de categoria de um dependente.',
  })
  async removeCategoryRestriction(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: SetCategoryRestrictionDto,
  ) {
    return this.guardianService.removeCategoryRestriction(
      user.id,
      dto.dependentId,
      dto.category,
    );
  }
}
