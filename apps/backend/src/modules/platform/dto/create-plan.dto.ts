import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsJSON,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({ example: 'Ambra Premium', description: 'Nome do Plano' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Acesso completo a todas as features',
    description: 'Descrição',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 199.9, description: 'Preço Mensal' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: 'SCHOOL_SAAS' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ example: 500, description: 'Máximo de Alunos' })
  @IsOptional()
  @IsNumber()
  maxStudents?: number;

  @ApiPropertyOptional({ example: 1, description: 'Máximo de Cantinas' })
  @IsOptional()
  @IsNumber()
  maxCanteens?: number;

  @ApiPropertyOptional({ example: 0, description: 'Limite de Crédito Padrão' })
  @IsOptional()
  @IsNumber()
  creditCeiling?: number;

  @ApiPropertyOptional({ description: 'Configuração de Taxas (JSON)' })
  @IsOptional()
  feesConfig?: any;

  @ApiPropertyOptional({ description: 'Lista de Features (JSON)' })
  @IsOptional()
  features?: any;
}
