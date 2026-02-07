import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

/**
 * DTO para criação de subconta Asaas em operador existente (seed/demo)
 * 
 * [v4.8] Demo Setup Endpoint - Permite SUPER_ADMIN configurar subcontas
 * reais do Asaas Sandbox para operadores criados via seed com dados fake.
 */
export class SetupAsaasSubaccountDto {
  @ApiProperty({
    description: 'Telefone celular do operador (com DDD)',
    example: '11999999999',
  })
  @IsNotEmpty({ message: 'Telefone celular é obrigatório' })
  @IsString()
  @Length(10, 11, { message: 'Telefone deve ter 10 ou 11 dígitos' })
  mobilePhone: string;

  @ApiProperty({
    description: 'CEP do endereço do operador',
    example: '01310100',
  })
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  @IsString()
  @Length(8, 8, { message: 'CEP deve ter 8 dígitos' })
  postalCode: string;

  @ApiProperty({
    description: 'Endereço completo (rua, avenida, etc)',
    example: 'Av. Paulista',
  })
  @IsNotEmpty({ message: 'Endereço é obrigatório' })
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '1000',
  })
  @IsNotEmpty({ message: 'Número do endereço é obrigatório' })
  @IsString()
  addressNumber: string;

  @ApiProperty({
    description: 'Data de nascimento (obrigatório para CPF)',
    example: '1990-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiProperty({
    description: 'Renda mensal (obrigatório para MEI/Individual)',
    example: 3000,
    required: false,
  })
  @IsOptional()
  incomeValue?: number;
}
