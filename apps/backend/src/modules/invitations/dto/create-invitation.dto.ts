import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({
    description: 'O email do responsável a ser convidado.',
    example: 'outro.responsavel@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  receiverEmail: string;
}
