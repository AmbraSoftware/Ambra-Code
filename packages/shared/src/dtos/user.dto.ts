import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, ValidateNested, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../enums';

/**
 * CreateUserDto - Single Source of Truth
 * 
 * DTO compartilhado entre Backend e Frontend para criação de usuários.
 * Suporta todas as roles definidas no enum UserRole.
 * 
 * @see AMBRA_CONTEXT.md - Single Source of Truth
 */
export class CreateStudentProfileDto {
  @IsOptional()
  @IsString()
  class?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restrictions?: string[];

  @IsOptional()
  @IsString()
  dailyLimit?: number;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsOptional() // Email opcional para operadores
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional() // Senha opcional apenas para atualização, mas requerida na criação
  password?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsOptional()
  @IsString()
  canteenId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStudentProfileDto)
  profile?: CreateStudentProfileDto;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  mobilePhone?: string;

  // Multi-role support (opcional, para compatibilidade futura)
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
