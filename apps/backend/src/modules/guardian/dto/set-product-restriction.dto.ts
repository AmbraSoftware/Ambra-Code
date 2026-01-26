import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SetProductRestrictionDto {
  @ApiProperty({
    description: 'O ID único do dependente ao qual a restrição se aplica.',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsUUID()
  @IsNotEmpty()
  dependentId: string;

  @ApiProperty({
    description: 'O ID único do produto a ser restringido.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
