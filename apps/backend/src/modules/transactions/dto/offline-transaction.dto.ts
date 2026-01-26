import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
} from 'class-validator';

export class OfflineTransactionDto {
  @IsString()
  @IsNotEmpty()
  offlineId: string;

  @IsUUID()
  @IsNotEmpty()
  walletId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  type: 'PURCHASE' | 'WITHDRAWAL';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  occurredAt: string; // ISO Date String
}

export class SyncBatchDto {
  transactions: OfflineTransactionDto[];
}
