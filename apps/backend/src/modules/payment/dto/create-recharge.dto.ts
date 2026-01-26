import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateRechargeDto {
  @ApiProperty({
    description: 'O ID único do dependente que receberá a recarga.',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsNotEmpty({ message: 'O ID do dependente é obrigatório.' })
  @IsUUID('4', { message: 'O ID do dependente deve ser um UUID válido.' })
  dependentId: string;

  @ApiProperty({
    description: 'O valor a ser recarregado. Deve ser um número positivo.',
    example: 25.5,
  })
  @IsNotEmpty({ message: 'O valor da recarga é obrigatório.' })
  @IsNumber({}, { message: 'O valor deve ser um número.' })
  @IsPositive({ message: 'O valor da recarga deve ser positivo.' })
  amount: number;
}
