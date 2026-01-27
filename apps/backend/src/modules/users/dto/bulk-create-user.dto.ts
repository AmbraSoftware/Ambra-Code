import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserDto } from '@nodum/shared';

export class BulkCreateUserDto {
    @ApiProperty({
        description: 'Lista de usuários para criar',
        type: [CreateUserDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateUserDto)
    users: CreateUserDto[];
}
