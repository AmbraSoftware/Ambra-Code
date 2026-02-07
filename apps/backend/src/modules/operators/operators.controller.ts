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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SetupAsaasSubaccountDto } from './dto/setup-asaas-subaccount.dto';

@ApiTags('Operators')
@ApiBearerAuth()
@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN')
  async create(@Body() data: any) {
    // Validation should be added (DTO)
    return this.operatorsService.createOperator(data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN', 'MERCHANT_ADMIN')
  async findAll() {
    return this.operatorsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Atualiza dados de um operador (Global Admin)' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.operatorsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove um operador (Global Admin)' })
  async remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }

  @Post('link-school')
  @UseGuards(JwtAuthGuard)
  @Roles('MERCHANT_ADMIN')
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

  /**
   * [v4.8] Endpoint para configurar subconta Asaas em operador existente
   * 
   * Permite SUPER_ADMIN configurar subcontas reais do Asaas Sandbox para
   * operadores criados via seed com dados fake.
   * 
   * É idempotente - pode ser chamado múltiplas vezes.
   */
  @Post(':id/setup-asaas')
  @UseGuards(JwtAuthGuard)
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[v4.8] Configura subconta Asaas para operador existente (DEMO)',
    description: `
Permite configurar subconta Asaas Sandbox para operadores criados via seed.

Requisitos:
- Usuário deve ser SUPER_ADMIN
- Operador deve ter taxId (CPF/CNPJ) válido cadastrado
- Dados de endereço e telefone são obrigatórios

Idempotente: se subconta já existe, retorna dados atuais.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Subconta configurada com sucesso ou já existente',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou falha na criação da subconta',
  })
  @ApiResponse({
    status: 404,
    description: 'Operador não encontrado',
  })
  async setupAsaasSubaccount(
    @Param('id') operatorId: string,
    @Body() dto: SetupAsaasSubaccountDto,
  ) {
    return this.operatorsService.setupAsaasSubaccount(operatorId, dto);
  }
}
