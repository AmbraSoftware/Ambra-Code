import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
  IsInt,
  IsUUID,
} from 'class-validator';

export enum CouponType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum CouponAudience {
  B2B = 'B2B',
  B2C = 'B2C',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}

export class CreateCouponDto {
  @ApiProperty({
    description: 'Código do cupom (uppercase)',
    example: 'ESCOLA10',
  })
  @IsString()
  code: string;

  @ApiProperty({ enum: CouponType, example: CouponType.PERCENTAGE })
  @IsEnum(CouponType)
  type: CouponType;

  @ApiProperty({ description: 'Valor do desconto (% ou R$)', example: 10 })
  @IsNumber()
  @Min(0)
  @Max(100) // Máximo para porcentagem; para FIXED podemos ter validação separada
  value: number;

  @ApiProperty({ enum: CouponAudience, example: CouponAudience.B2B })
  @IsEnum(CouponAudience)
  audience: CouponAudience;

  @ApiPropertyOptional({
    description: 'ID do plano restrito (opcional)',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiProperty({
    description: 'Data de validade (ISO8601)',
    example: '2026-03-30T00:00:00Z',
  })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({
    description: 'Número máximo de usos (null = ilimitado)',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: CouponType })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ enum: CouponAudience })
  @IsOptional()
  @IsEnum(CouponAudience)
  audience?: CouponAudience;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ enum: CouponStatus })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;
}

export class CouponResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: CouponType })
  type: CouponType;

  @ApiProperty()
  value: number;

  @ApiProperty({ enum: CouponAudience })
  audience: CouponAudience;

  @ApiPropertyOptional()
  planId?: string;

  @ApiPropertyOptional()
  planName?: string;

  @ApiProperty()
  validUntil: Date;

  @ApiPropertyOptional()
  maxUses?: number;

  @ApiProperty()
  usedCount: number;

  @ApiProperty({ enum: CouponStatus })
  status: CouponStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
