import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CashInDto {
  @ApiProperty({
    description: 'O ID único do aluno/dependente que receberá a recarga de balcão.',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsNotEmpty({ message: 'O ID do dependente é obrigatório.' })
  @IsUUID('4', { message: 'O ID do dependente deve ser um UUID válido.' })
  dependentId: string;

  @ApiProperty({
    description: 'Valor em dinheiro a ser convertido em saldo na carteira (recarga de balcão).',
    example: 2.0,
  })
  @IsNotEmpty({ message: 'O valor é obrigatório.' })
  @IsNumber({}, { message: 'O valor deve ser um número.' })
  @IsPositive({ message: 'O valor deve ser positivo.' })
  amount: number;
}
