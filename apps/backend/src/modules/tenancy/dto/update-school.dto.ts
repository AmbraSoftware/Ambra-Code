import {
  IsString,
  IsOptional,
  Matches,
  IsUUID,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * UPDATE SCHOOL DTO v3.8.5 - NODUM KERNEL READY
 * Permite atualização parcial de tenants (escolas).
 */
export class UpdateSchoolDto {
  @ApiProperty({
    example: 'Colégio Vitta Unidade 2',
    description: 'Nome oficial da instituição de ensino',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'vitta-unidade-2',
    description: 'Identificador único para a URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hifens.',
  })
  slug?: string;

  @ApiProperty({
    example: '9657c91e-3558-45b0-9f5b-b9d5690b9687',
    description: 'ID do plano comercial',
    required: false,
  })
  @IsUUID('4', { message: 'O planId deve ser um UUID v4 válido.' })
  @IsOptional()
  planId?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'SUSPENDED', 'PENDING'],
    required: false,
  })
  @IsEnum(['ACTIVE', 'SUSPENDED', 'PENDING'])
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING';

  @ApiProperty({
    example: {
      primaryColor: '#FC5407',
      logo: 'https://cdn.nodum.app/logo.png',
    },
    description: 'Configurações de white-label (JSON)',
    required: false,
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
