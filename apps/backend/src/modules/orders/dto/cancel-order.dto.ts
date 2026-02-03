import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Motivo do cancelamento',
    example: 'Pedido feito por engano',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
