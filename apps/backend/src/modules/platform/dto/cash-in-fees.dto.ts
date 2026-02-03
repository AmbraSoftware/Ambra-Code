import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, Min, Max } from 'class-validator';

export class PaymentMethodFeeDto {
  @ApiProperty({ description: 'Custo do gateway por transação', example: 3.49 })
  @IsNumber()
  @Min(0)
  gatewayCost: number;

  @ApiProperty({ description: 'Cobrar taxa do cliente?', example: true })
  @IsBoolean()
  chargeCustomer: boolean;

  @ApiProperty({ description: 'Taxa fixa ao cliente (R$)', example: 4.0 })
  @IsNumber()
  @Min(0)
  customerFeeFixed: number;

  @ApiProperty({ description: 'Taxa percentual ao cliente (%)', example: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  customerFeePercent: number;

  @ApiProperty({ description: 'Cobrar taxa do merchant?', example: false })
  @IsBoolean()
  chargeMerchant: boolean;

  @ApiProperty({ description: 'Taxa fixa ao merchant (R$)', example: 0 })
  @IsNumber()
  @Min(0)
  merchantFeeFixed: number;

  @ApiProperty({ description: 'Taxa percentual ao merchant (%)', example: 2.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  merchantFeePercent: number;
}

export class UpdateCashInFeesDto {
  @ApiProperty({ type: PaymentMethodFeeDto })
  boleto: PaymentMethodFeeDto;

  @ApiProperty({ type: PaymentMethodFeeDto })
  pix: PaymentMethodFeeDto;
}

export class CashInFeesResponseDto {
  @ApiProperty()
  boleto: PaymentMethodFeeDto;

  @ApiProperty()
  pix: PaymentMethodFeeDto;

  @ApiProperty()
  updatedAt: Date;
}
