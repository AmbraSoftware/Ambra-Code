import { ApiProperty } from '@nestjs/swagger';

type UserRole =
  | 'GLOBAL_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'CANTEEN_OPERATOR'
  | 'GUARDIAN'
  | 'STUDENT';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  canteenId: string | null;
}

export class UserProfileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ example: 'João da Silva' })
  name: string;

  @ApiProperty({ example: 'joao.silva@example.com' })
  email: string;

  @ApiProperty({
    example: 'GUARDIAN',
    enum: [
      'GLOBAL_ADMIN',
      'SCHOOL_ADMIN',
      'CANTEEN_OPERATOR',
      'GUARDIAN',
      'STUDENT',
    ],
  })
  role: UserRole;

  @ApiProperty({
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
    nullable: true,
  })
  schoolId: string | null;
}
