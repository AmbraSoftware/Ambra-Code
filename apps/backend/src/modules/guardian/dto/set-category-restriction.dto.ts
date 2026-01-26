import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SetCategoryRestrictionDto {
  @ApiProperty({
    description: 'O ID único do dependente ao qual a restrição se aplica.',
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
  })
  @IsUUID()
  @IsNotEmpty()
  dependentId: string;

  @ApiProperty({
    description: 'A categoria de produto a ser restringida.',
    example: 'Refrigerantes',
  })
  @IsString()
  @IsNotEmpty()
  category: string;
}
