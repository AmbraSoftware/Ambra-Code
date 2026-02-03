import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  BadRequestException,
  Patch,
  Delete,
  Param,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Operators')
@ApiBearerAuth()
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() data: any) {
    // Validation should be added (DTO)
    return this.operatorsService.createOperator(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MERCHANT_ADMIN)
  async findAll() {
    return this.operatorsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Atualiza dados de um operador (Global Admin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.operatorsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove um operador (Global Admin)' })
  async remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }

  @Post('link-school')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.MERCHANT_ADMIN)
  @ApiOperation({
    summary: 'Vincula o operador a uma escola via código de acesso',
  })
  async linkSchool(@Request() req, @Body() body: { accessCode: string }) {
    if (!body.accessCode) {
      throw new BadRequestException('Código de acesso é obrigatório');
    }
    // Assume que o usuário logado tem um canteenId ou operatorId vinculado
    return this.operatorsService.linkSchool(req.user, body.accessCode);
  }
}
