import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RequestRefundDto {
  @IsUUID()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  pixKey: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  pixKeyType?: string;
}
