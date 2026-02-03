import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import { UserRole } from '@prisma/client';
import { StoreService } from './store.service';

@ApiTags('Store')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('favorites')
  @Roles(
    UserRole.GUARDIAN,
    UserRole.STUDENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.MERCHANT_ADMIN,
    UserRole.OPERATOR_SALES,
    UserRole.OPERATOR_MEAL,
  )
  @ApiOperation({
    summary: 'Lista IDs de produtos favoritados pelo usuário atual.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de IDs de produtos favoritados.',
  })
  async getFavorites(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.storeService.getFavoriteProductIds({
      userId: user.id,
      schoolId: user.schoolId!,
    });
  }

  @Post('favorites/:productId/toggle')
  @Roles(
    UserRole.GUARDIAN,
    UserRole.STUDENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.MERCHANT_ADMIN,
    UserRole.OPERATOR_SALES,
    UserRole.OPERATOR_MEAL,
  )
  @ApiOperation({ summary: 'Favorita/desfavorita um produto (toggle).' })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado.',
    schema: { example: { isFavorited: true } },
  })
  async toggleFavorite(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.storeService.toggleFavorite({
      userId: user.id,
      schoolId: user.schoolId!,
      productId,
    });
  }
}
