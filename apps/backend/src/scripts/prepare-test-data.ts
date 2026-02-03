// apps/backend/src/scripts/prepare-test-data.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { SchoolStatus, UserRole, ProductType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const logger = new Logger('PrepareTestData');

  console.log('\n🔍 VERIFICANDO DADOS PARA TESTES CRÍTICOS...\n');

  let school = await prisma.school.findFirst({ where: { status: SchoolStatus.ACTIVE } });
  let student = await prisma.user.findFirst({ where: { role: UserRole.STUDENT } });
  let product = await prisma.product.findFirst({ where: { stock: { gt: 10 } } });
  let operator = await prisma.user.findFirst({ 
    where: { role: { in: [UserRole.OPERATOR_SALES, UserRole.SCHOOL_ADMIN] } }
  });

  const missing: string[] = [];
  if (!school) missing.push('Escola ATIVA');
  if (!student) missing.push('Aluno (STUDENT)');
  if (!product) missing.push('Produto com stock>10');
  if (!operator) missing.push('Operador (OPERATOR_SALES/SCHOOL_ADMIN)');

  if (missing.length === 0) {
    console.log('✅ Todos os dados necessários existem no banco:');
    console.log(`   - Escola: ${school?.name} (${school?.id})`);
    console.log(`   - Aluno: ${student?.name} (${student?.id})`);
    console.log(`   - Produto: ${product?.name} (stock: ${product?.stock})`);
    console.log(`   - Operador: ${operator?.name} (${operator?.role})`);
    console.log('\n🚀 Pronto para executar: verify-critical-features.ts\n');
    await app.close();
    return;
  }

  console.log(`⚠️  Dados faltando: ${missing.join(', ')}`);
  console.log('🌱 Criando dados mínimos de seed...\n');

  const saltRounds = 10;
  const defaultPassword = await bcrypt.hash('Test@123456', saltRounds);

  // 1. Criar sistema/plano se necessário
  let system = await prisma.platformSystem.findFirst();
  if (!system) {
    system = await prisma.platformSystem.create({
      data: { name: 'Test System', slug: 'test-system' }
    });
  }

  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Plano Teste',
        price: 150,
        target: 'SCHOOL_SAAS',
        feesConfig: {},
      }
    });
  }

  // 2. Criar Escola se necessário
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Escola Teste Crítica',
        slug: 'escola-teste-critica',
        taxId: '12345678000199',
        status: SchoolStatus.ACTIVE,
        systemId: system.id,
        planId: plan.id,
      }
    });
    console.log(`✅ Escola criada: ${school.name} (${school.id})`);
  }

  // 3. Criar Operador se necessário
  if (!operator) {
    operator = await prisma.user.create({
      data: {
        email: 'operador.teste@ambra.local',
        name: 'Operador Teste',
        passwordHash: defaultPassword,
        role: UserRole.OPERATOR_SALES,
        schoolId: school.id,
      }
    });
    console.log(`✅ Operador criado: ${operator.name} (${operator.id})`);
  }

  // 4. Criar Aluno se necessário
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: 'aluno.teste@ambra.local',
        name: 'Aluno Teste',
        passwordHash: defaultPassword,
        role: UserRole.STUDENT,
        schoolId: school.id,
        document: '12345678900',
      }
    });

    // Criar carteira para o aluno
    await prisma.wallet.create({
      data: {
        userId: student.id,
        balance: 10000,
        overdraftLimit: 50,
        dailySpendLimit: 100,
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        canPurchaseAlone: true,
      }
    });
    console.log(`✅ Aluno criado: ${student.name} (${student.id}) + Carteira`);
  }

  // 5. Criar Cantina se não existir
  let canteen = await prisma.canteen.findFirst({ where: { schoolId: school.id } });
  if (!canteen) {
    canteen = await prisma.canteen.create({
      data: {
        name: 'Cantina Teste',
        schoolId: school.id,
        type: 'COMMERCIAL',
        status: 'ACTIVE',
        openingTime: '07:00',
        closingTime: '18:00',
      }
    });
    console.log(`✅ Cantina criada: ${canteen.name} (${canteen.id})`);
  }

  // 6. Criar Produto se necessário
  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Produto Teste Estoque',
        price: 15.99,
        stock: 100,
        category: 'LANCHE',
        canteenId: canteen.id,
        schoolId: school.id,
        isAvailable: true,
        type: ProductType.SALE,
      }
    });
    console.log(`✅ Produto criado: ${product.name} (stock: ${product.stock})`);
  }

  console.log('\n✨ DADOS DE TESTE CRIADOS COM SUCESSO!');
  console.log('\n🚀 Agora execute: npx ts-node -r tsconfig-paths/register apps/backend/src/scripts/verify-critical-features.ts\n');

  await app.close();
}

bootstrap().catch((e) => {
  console.error('❌ Erro:', e);
  process.exit(1);
});
