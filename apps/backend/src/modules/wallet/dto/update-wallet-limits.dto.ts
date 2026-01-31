import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateWalletLimitsDto {
  @ApiPropertyOptional({
    description: 'Limite SOS (permitir saldo negativo controlado).',
    example: 6.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'overdraftLimit deve ser um número.' })
  @Min(0, { message: 'overdraftLimit deve ser >= 0.' })
  overdraftLimit?: number;

  @ApiPropertyOptional({
    description: 'Limite diário de gastos.',
    example: 30.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'dailySpendLimit deve ser um número.' })
  @Min(0, { message: 'dailySpendLimit deve ser >= 0.' })
  dailySpendLimit?: number;
}
