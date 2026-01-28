import { ApiProperty } from '@nestjs/swagger';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'MERCHANT_ADMIN'
  | 'OPERATOR_SALES'
  | 'OPERATOR_MEAL'
  | 'GOV_ADMIN'
  | 'GUARDIAN'
  | 'STUDENT'
  | 'CONSUMER'
  // Legacy
  // Legacy roles removidos

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role?: UserRole;
  roles: UserRole[];
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
    example: ['GUARDIAN'],
    isArray: true,
    enum: [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'MERCHANT_ADMIN',
      'OPERATOR_SALES',
      'OPERATOR_MEAL',
      'GOV_ADMIN',
      'GUARDIAN',
      'STUDENT',
      'CONSUMER',
    ],
  })
  roles: UserRole[];

  @ApiProperty({
    example: 'f0e9d8c7-b6a5-4321-fedc-ba9876543210',
    nullable: true,
  })
  schoolId: string | null;
}
