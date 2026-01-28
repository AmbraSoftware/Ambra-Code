import { IsCpfCnpj } from '../../../common/validators/is-cpf-cnpj.validator';
import { Validate, IsString, IsNotEmpty, IsEmail, Matches, MinLength, IsUUID, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * CREATE SCHOOL DTO
 * Valida a criação de novos tenants dentro da hierarquia Multi-multi-tenant.
 * Suporta configuração híbrida (Merenda + Cantina).
 */
export class CreateSchoolDto {
  @ApiProperty({
    example: 'uuid-v4-do-sistema-ambra',
    description: 'ID do sistema affiliate (ex: AMBRA)',
  })
  @IsUUID('4', { message: 'O systemId deve ser um UUID v4 válido.' })
  @IsNotEmpty()
  systemId!: string;

  @ApiProperty({
    example: 'Colégio Vitta Unidade 1',
    description: 'Nome oficial da instituição de ensino',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '12.345.678/0001-99',
    description: 'CNPJ da Instituição (Validação de conformidade fiscal)',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(IsCpfCnpj, { message: 'O CNPJ informado é inválido.' })
  taxId!: string;

  @ApiProperty({
    example: 'vitta-itape',
    description: 'Identificador único para a URL (ex: vitta-itape.nodum.app)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'O slug deve conter apenas letras minúsculas, números e hifens.',
  })
  slug!: string;

  @ApiProperty({
    example: '9657c91e-3558-45b0-9f5b-b9d5690b9687',
    description: 'ID do plano (Verificar UUIDs no ficheiro de Seed)',
  })
  @IsUUID('4', { message: 'O planId deve ser um UUID v4 válido.' })
  @IsNotEmpty()
  planId!: string;

  @ApiProperty({
    example: 'Admin Vitta',
    description: 'Nome do gestor responsável pela unidade',
  })
  @IsString()
  @IsNotEmpty()
  adminName!: string;

  @ApiProperty({
    example: 'admin@vitta.com',
    description: 'E-mail de login do gestor da escola',
  })
  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  adminEmail!: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha de acesso (Mínimo 8 caracteres)',
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
  adminPassword!: string;

  @ApiProperty({
    example: true,
    description: 'Habilita gestão de merenda governamental (gratuita)',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  hasMerenda?: boolean;

  @ApiProperty({
    example: true,
    description: 'Habilita vendas comerciais de lanches e produtos',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  hasCanteen?: boolean;
}
