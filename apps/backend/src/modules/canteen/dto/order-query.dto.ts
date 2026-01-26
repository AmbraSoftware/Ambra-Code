import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

type OrderStatus = 'PENDING' | 'PAID' | 'DELIVERED' | 'CANCELLED';
const validStatus: OrderStatus[] = [
  'PENDING',
  'PAID',
  'DELIVERED',
  'CANCELLED',
];

export class OrderQueryDto {
  @ApiProperty({
    description: 'Filtra os pedidos por um status específico.',
    enum: validStatus,
    required: false,
  })
  @IsEnum(validStatus)
  @IsOptional()
  status?: OrderStatus;
}
