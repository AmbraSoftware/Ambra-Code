import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSystemDto {
  @ApiProperty({
    example: 'AMBRA (Food)',
    description: 'Nome da vertical de negócio.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'ambra',
    description: 'Slug único para identificação no sistema.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug deve conter apenas letras, números e hifens.',
  })
  slug: string;

  @ApiProperty({ example: 'Gestão de cantinas escolares', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
