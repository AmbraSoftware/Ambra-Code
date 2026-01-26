import { IsString, IsOptional, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSystemDto {
  @ApiProperty({
    example: 'AMBRA (Food & Experience)',
    description: 'Nome da vertical de negócio.',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'ambra-food',
    description: 'Slug único para identificação no sistema.',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras, números e hifens.',
  })
  slug?: string;

  @ApiProperty({
    example: 'Gestão completa de cantinas escolares com IA',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false,
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
