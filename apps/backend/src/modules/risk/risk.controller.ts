import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { RiskService } from './risk.service';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { UserRole } from '@prisma/client';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Controller for Risk Management.
 * Should be protected by Admin roles in production.
 */
@Controller('risk')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get('internal/:userId')
  // @Roles(UserRole.GLOBAL_ADMIN, UserRole.SCHOOL_ADMIN)
  async getInternalScore(@Param('userId') userId: string) {
    return this.riskService.calculateInternalScore(userId);
  }

  @Post('serasa-simulation')
  // @Roles(UserRole.GLOBAL_ADMIN)
  async consultSerasa(@Body() body: { document: string }) {
    return this.riskService.consultExternalSerasa(body.document);
  }

  @Get('metrics')
  // @Roles(UserRole.GLOBAL_ADMIN, UserRole.SCHOOL_ADMIN)
  async getRiskMetrics() {
    return this.riskService.getSystemicRiskMetrics();
  }
}
