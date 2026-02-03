import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateCashInDto {
  @ApiProperty({
    description: 'ID do usuário que receberá a recarga',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Valor da recarga em reais',
    example: 50.0,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Método de pagamento físico (CASH, CARD, PIX_MANUAL)',
    example: 'CASH',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  paymentMethod?: string;

  @ApiProperty({
    description: 'Observação/Descrição da transação',
    example: 'Recarga em dinheiro - Balcão',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
