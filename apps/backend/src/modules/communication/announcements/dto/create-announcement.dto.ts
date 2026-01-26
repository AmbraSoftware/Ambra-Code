import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(UserRole)
  targetRole: UserRole;

  // Use string type for enum to avoid import cycles, validated by service/db
  @IsNotEmpty()
  scope: 'GLOBAL' | 'GOVERNMENT' | 'SYSTEM' | 'SCHOOL' | 'INDIVIDUAL';

  @IsOptional()
  targetIds?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
