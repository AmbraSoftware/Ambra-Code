import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({
    description:
      'A versão do registro, para controle de concorrência (Optimistic Locking).',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  version: number;
}
