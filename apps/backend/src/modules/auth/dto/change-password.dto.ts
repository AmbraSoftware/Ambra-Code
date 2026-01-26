import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
    newPassword: string;
}
