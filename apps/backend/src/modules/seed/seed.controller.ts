import { Controller, Post, Body, HttpException, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { WipRoute } from '../../common/decorators/swagger-badges.decorator';

/**
 * DTO para executar o seed
 */
class SeedDto {
  secret!: string;
}

/**
 * Seed Controller - Endpoint para popular o banco com dados iniciais
 * Útil para primeira configuração no Railway
 */
@ApiTags('Setup')
@Controller('setup')
export class SeedController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @WipRoute('Executa seed do banco (primeira configuração)', {
    description: 'Cria usuários, escolas, planos e dados de teste. Requer SECRET_KEY.',
  })
  @ApiResponse({ status: 200, description: 'Seed executado com sucesso' })
  @ApiResponse({ status: 401, description: 'Secret inválido' })
  @ApiResponse({ status: 500, description: 'Erro ao executar seed' })
  async runSeed(@Body() body: SeedDto) {
    // Verificar secret
    const expectedSecret = process.env.SETUP_SECRET || 'setup-local-dev';
    if (body.secret !== expectedSecret) {
      throw new HttpException('Secret inválido', HttpStatus.UNAUTHORIZED);
    }

    try {
      const result = await this.executeSeed();
      return {
        success: true,
        message: 'Seed executado com sucesso',
        data: result,
      };
    } catch (error: any) {
      throw new HttpException(
        `Erro ao executar seed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async executeSeed() {
    const saltRounds = 10;
    const adminPassword = 'Diel@0002323';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
    const masterEmail = 'admin@nodum.io';
    const password123 = await bcrypt.hash('password123', saltRounds);

    // 1. PLANO
    const plan = await this.prisma.plan.upsert({
      where: { id: '9657c91e-3558-45b0-9f5b-b9d5690b9687' },
      update: {},
      create: {
        id: '9657c91e-3558-45b0-9f5b-b9d5690b9687',
        name: 'Plano Essencial (B2B)',
        price: 150.0,
        status: 'ACTIVE',
        features: { whiteLabel: true },
      },
    });

    // 2. OPERADOR
    const operator = await this.prisma.operator.upsert({
      where: { taxId: '11.111.111/0001-11' },
      update: {},
      create: {
        name: 'Colégio Elite Mantenedora Ltda',
        taxId: '11.111.111/0001-11',
        asaasApiKey: '$aact_elite_key',
        asaasId: 'wall_elite_001',
      },
    });

    // 3. ESCOLA
    const school = await this.prisma.school.upsert({
      where: { taxId: '11.111.111/0001-11' },
      update: {},
      create: {
        name: 'Colégio Elite Santos',
        taxId: '11.111.111/0001-11',
        slug: 'colegio-elite',
        planId: plan.id,
        status: 'ACTIVE',
      },
    });

    // 4. CANTINA
    const canteen = await this.prisma.canteen.upsert({
      where: { id: 'canteen-elite-001' },
      update: {},
      create: {
        id: 'canteen-elite-001',
        name: 'Cantina Principal',
        type: 'COMMERCIAL',
        schoolId: school.id,
        operatorId: operator.id,
      },
    });

    // 5. USUÁRIOS
    const admin = await this.prisma.user.upsert({
      where: { email: masterEmail },
      update: { passwordHash: hashedAdminPassword },
      create: {
        name: 'Gabriel Nodum Master',
        email: masterEmail,
        passwordHash: hashedAdminPassword,
        role: UserRole.SUPER_ADMIN,
        roles: [UserRole.SUPER_ADMIN],
      },
    });

    const manager = await this.prisma.user.upsert({
      where: { email: 'manager@elite.com' },
      update: { passwordHash: password123 },
      create: {
        name: 'Diretor Elite',
        email: 'manager@elite.com',
        passwordHash: password123,
        role: UserRole.SCHOOL_ADMIN,
        roles: [UserRole.SCHOOL_ADMIN],
        schoolId: school.id,
        termsAccepted: true,
        termsVersion: 'v1',
      },
    });

    const operatorUser = await this.prisma.user.upsert({
      where: { email: 'caixa@elite.com' },
      update: { passwordHash: password123 },
      create: {
        name: 'Operador Caixa 01',
        email: 'caixa@elite.com',
        passwordHash: password123,
        role: UserRole.OPERATOR_SALES,
        roles: [UserRole.OPERATOR_SALES],
        schoolId: school.id,
        termsAccepted: true,
        termsVersion: 'v1',
      },
    });

    const student = await this.prisma.user.upsert({
      where: { email: 'aluno@elite.com' },
      update: { passwordHash: password123 },
      create: {
        name: 'Aluno Teste',
        email: 'aluno@elite.com',
        passwordHash: password123,
        role: UserRole.STUDENT,
        roles: [UserRole.STUDENT],
        schoolId: school.id,
        birthDate: new Date('2000-01-01'),
        termsAccepted: true,
        termsVersion: 'v1',
      },
    });

    // 6. WALLET DO ALUNO
    await this.prisma.wallet.upsert({
      where: { userId: student.id },
      update: { balance: 150.0 },
      create: {
        userId: student.id,
        balance: 150.0,
        dailySpendLimit: 50.0,
      },
    });

    return {
      users: [
        { email: masterEmail, password: adminPassword, role: 'SUPER_ADMIN' },
        { email: 'manager@elite.com', password: 'password123', role: 'SCHOOL_ADMIN' },
        { email: 'caixa@elite.com', password: 'password123', role: 'OPERATOR_SALES' },
        { email: 'aluno@elite.com', password: 'password123', role: 'STUDENT', wallet: 150.0 },
      ],
      school: school.name,
      canteen: canteen.name,
    };
  }
}
