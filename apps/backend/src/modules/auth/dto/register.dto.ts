import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsIn,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsCpfCnpj } from '../../../common/validators/is-cpf-cnpj.validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['school', 'operator'])
  profileType: 'school' | 'operator';

  @IsNotEmpty()
  @IsString()
  entityName: string;

  @IsNotEmpty()
  @IsString()
  @IsCpfCnpj({
    message: 'CPF ou CNPJ inválido (verifique os dígitos verificadores).',
  })
  taxId: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  // Strong password regex: 8+ chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must be strong (1 uppercase, 1 lowercase, 1 number/special char).',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsNotEmpty()
  @IsString()
  consentVersion: string;

  @IsNotEmpty()
  @IsBoolean()
  termsAccepted: boolean;

  // [v3.8.5] PLG / Asaas Requirements
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  addressNumber?: string;

  @IsOptional()
  @IsString()
  // Format: YYYY-MM-DD
  birthDate?: string;

  @IsOptional()
  incomeValue?: number;

  @IsOptional()
  @IsString()
  planId?: string; // If not provided, defaults to Basic
}
