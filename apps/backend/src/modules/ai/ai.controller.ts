import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { AiService } from './ai.service';
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
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('AI Reports')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService, // Injetado para validação de parentesco
  ) {}

  @Get('nutritional-report/:studentId')
  @Roles('GUARDIAN')
  @ApiOperation({
    summary: 'Gera um relatório nutricional por IA para um dependente.',
  })
  @ApiResponse({ status: 200, description: 'Relatório gerado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado.' })
  @ApiResponse({ status: 404, description: 'Aluno não encontrado.' })
  async getNutritionalReport(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('studentId', new ParseUUIDPipe()) studentId: string,
  ) {
    // Validação de segurança: garante que o solicitante é responsável pelo aluno.
    const isDependent = await this.prisma.user.count({
      where: {
        id: studentId,
        guardianRelations: { some: { guardianId: user.id } },
      },
    });

    if (isDependent === 0) {
      throw new ForbiddenException(
        'Acesso negado. Você só pode gerar relatórios para seus dependentes.',
      );
    }

    return this.aiService.generateNutritionalReport(studentId);
  }
}
