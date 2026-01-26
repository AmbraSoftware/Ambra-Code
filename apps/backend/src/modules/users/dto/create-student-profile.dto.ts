import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStudentProfileDto {
  @ApiProperty({ description: 'Turma ou Série do aluno', example: '5º Ano A' })
  @IsString()
  @IsOptional()
  class?: string;

  @ApiProperty({ description: 'Lista de alergias ou restrições', example: ['Amendoim', 'Lactose'] })
  @IsArray()
  @IsOptional()
  restrictions?: string[];

  @ApiProperty({ description: 'Limite diário de gastos', example: 50.00 })
  @IsNumber()
  @IsOptional()
  dailyLimit?: number;
}
