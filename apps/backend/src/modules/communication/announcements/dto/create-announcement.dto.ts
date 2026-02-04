import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  targetRole: string;

  // Use string type for enum to avoid import cycles, validated by service/db
  @IsNotEmpty()
  scope: 'GLOBAL' | 'GOVERNMENT' | 'SYSTEM' | 'SCHOOL' | 'INDIVIDUAL';

  @IsOptional()
  targetIds?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
