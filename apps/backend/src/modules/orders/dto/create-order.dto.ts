import { IsArray, IsInt, IsNotEmpty, IsOptional, IsUUID, Min, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsUUID()
  studentId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
