import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from '@nodum/shared';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
