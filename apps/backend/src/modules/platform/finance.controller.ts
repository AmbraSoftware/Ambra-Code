import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Finance (Operational Costs)')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  @Get('costs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Lista custos operacionais da plataforma.' })
  async getCosts() {
    return [
      {
        id: '1',
        category: 'Infraestrutura',
        provider: 'AWS',
        cost: 450.0,
        status: 'Pago',
        lastInvoice: '2024-03-01',
      },
      {
        id: '2',
        category: 'Mensageria',
        provider: 'Twilio',
        cost: 120.5,
        status: 'Pendente',
        lastInvoice: '2024-03-05',
      },
      {
        id: '3',
        category: 'CI/CD',
        provider: 'Vercel',
        cost: 20.0,
        status: 'Pago',
        lastInvoice: '2024-02-28',
      },
    ];
  }
}
