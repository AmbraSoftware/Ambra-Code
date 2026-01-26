import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/users.decorator';
import { AuthenticatedUserPayload } from '../auth/dto/user-payload.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ImportService } from './import.service';
import { Express } from 'express';

@ApiTags('Import')
@ApiBearerAuth()
@Controller('import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('students')
  @Roles('SCHOOL_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary:
      'Importa alunos e responsáveis em massa a partir de um arquivo (CSV, Excel) ou imagem.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Arquivo de lista de alunos (imagem, CSV, etc.). Tamanho máximo: 10MB.',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Importação concluída com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Arquivo não enviado ou inválido.' })
  async uploadStudents(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }
    if (!user.schoolId) {
      throw new ForbiddenException('Administrador não associado a uma escola.');
    }
    return this.importService.processStudentImport(file, user.schoolId);
  }
}
