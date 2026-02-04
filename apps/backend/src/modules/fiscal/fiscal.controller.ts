import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FiscalService } from './fiscal.service';

@ApiTags('Fiscal (Invoices)')
@ApiBearerAuth()
@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Get('invoices')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'GOV_ADMIN')
  @ApiOperation({ summary: 'Lista as últimas 50 notas fiscais (RLS Ativo).' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notas fiscais retornada com sucesso.',
  })
  async findAll(@Request() req) {
    // Enforce RLS: Authenticated user's schoolId
    const schoolId = req.user.schoolId;
    return this.fiscalService.findAllInvoices(schoolId);
  }

  @Get('commissions/pending')
  @Roles('SUPER_ADMIN')
  @ApiOperation({
    summary: 'Lista comissões acumuladas aguardando faturamento.',
  })
  async getPendingCommissions() {
    // Mock response for now to unblock 404
    return [];
  }
}
