import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Nome do produto',
    example: 'Suco de Laranja Natural',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Preço padrão do produto', example: 5.5 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Preço com desconto (opcional)',
    example: 4.99,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiProperty({ description: 'Quantidade inicial em estoque', example: 100 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Nível mínimo de estoque para alerta',
    example: 10,
  })
  @IsInt()
  @Min(0)
  minStockAlert: number;

  @ApiProperty({ description: 'Categoria do produto', example: 'Bebidas' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'URL da imagem do produto (opcional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Indica se o produto é um kit (combo)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isKit?: boolean;

  @ApiProperty({
    description: 'Indica se o produto está disponível para venda',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
