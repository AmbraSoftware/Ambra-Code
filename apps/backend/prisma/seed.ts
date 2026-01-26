/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient, PlanStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

/**
 * SEED MASTER v4.0.3 - FINAL GENESIS
 * Cenários:
 * A) Colégio Elite (Escola = Operador)
 * B) ETEC São Vicente (MEI Seu João)
 * C) Escola Municipal (Merenda Híbrida)
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não encontrada no arquivo .env');
}
console.log('DB URL found:', connectionString.replace(/:[^:]*@/, ':****@'));

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🏗️  Iniciando Sincronização SOBERANIA v4.0 (GENESIS)...');

  const saltRounds = 10;
  const adminPassword = 'Diel@0002323';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
  const masterEmail = 'admin@nodum.io';

  // 1. VERTICAL
  const ambraSystem = await (prisma as any).platformSystem.upsert({
    where: { slug: 'ambra' },
    update: { name: 'AMBRA (Food & Experience)' },
    create: {
      name: 'AMBRA (Food & Experience)',
      slug: 'ambra',
      description: 'Sistema operacional de alta performance para cantinas e nutrição escolar.',
      status: 'ACTIVE',
    },
  });

  // 2. PLANOS (Atualizado com Taxas do ROI v4.7)
  const plans = [
    { 
      id: '9657c91e-3558-45b0-9f5b-b9d5690b9687', 
      name: 'Plano Essencial (B2B)', 
      price: 150.0,
      target: 'SCHOOL_SAAS',
      feesConfig: {
        rechargeFixed: 3.00,
        rechargePercent: 5.0, // 5%
        creditRiskFixed: 1.00,
        creditRiskPercent: 4.0, // 4%
        transactionPercent: 4.0 // 4%
      }
    },
    { 
      id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 
      name: 'Ambra Food Premium (B2C)', 
      price: 15.99,
      target: 'GUARDIAN_PREMIUM',
      feesConfig: {
        rechargeFixed: 0.00,
        rechargePercent: 0.0,
        creditRiskFixed: 0.00,
        creditRiskPercent: 0.0,
        transactionPercent: 0.0
      }
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: { 
          price: plan.price, 
          // @ts-ignore - Prisma types update async
          feesConfig: plan.feesConfig,
          // @ts-ignore
          target: plan.target
      },
      create: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        status: PlanStatus.ACTIVE,
        features: { whiteLabel: true },
        // @ts-ignore
        feesConfig: plan.feesConfig,
        // @ts-ignore
        target: plan.target
      },
    });
  }

  // 3. OPERADORES FINANCEIROS
  console.log('💰 Semeando Operadores Financeiros...');

  // Cenário A: A própria escola (Elite)
  const opElite = await prisma.operator.upsert({
    where: { taxId: '11.111.111/0001-11' },
    update: {},
    create: {
      name: 'Colégio Elite Mantenedora Ltda',
      taxId: '11.111.111/0001-11',
      asaasApiKey: '$aact_elite_key',
      asaasId: 'wall_elite_001',
    }
  });

  // Cenário B: O MEI (Seu João)
  const opSeuJoao = await prisma.operator.upsert({
    where: { taxId: '22.222.222/0001-22' },
    update: {},
    create: {
      name: 'João da Silva Cantina MEI',
      taxId: '22.222.222/0001-22',
      asaasApiKey: '$aact_joao_key',
      asaasId: 'wall_joao_002',
    }
  });

  // Cenário C: Catering (Dona Tereza)
  const opCatering = await prisma.operator.upsert({
    where: { taxId: '33.333.333/0001-33' },
    update: {},
    create: {
      name: 'Tereza Foods Catering S/A',
      taxId: '33.333.333/0001-33',
      asaasApiKey: '$aact_catering_key',
      asaasId: 'wall_catering_003'
    }
  });

  // 4. GOVERNO
  const gov = await prisma.government.upsert({
    where: { slug: 'pref-sp-v4' },
    update: {},
    create: {
      name: 'Prefeitura de São Vicente (v4.0)',
      taxId: '46.000.000/0001-00',
      slug: 'pref-sp-v4',
      systemId: ambraSystem.id,
      planId: plans[0].id, 
    },
  });

  // 5. ESCOLAS (LOCAIS)
  console.log('🏫 Semeando Escolas (Locais)...');

  // Cenário A: Colégio Elite
  const schoolElite = await prisma.school.upsert({
    where: { taxId: '11.111.111/0001-11' },
    update: {},
    create: {
      name: 'Colégio Elite Santos',
      taxId: '11.111.111/0001-11',
      slug: 'colegio-elite',
      systemId: ambraSystem.id,
      planId: plans[0].id,
      status: 'ACTIVE',
      canteens: {
        create: {
          name: 'Cantina Principal',
          type: 'COMMERCIAL',
          operatorId: opElite.id,
        }
      }
    }
  });

  // Cenário B: ETEC
  const schoolEtec = await prisma.school.upsert({
    where: { taxId: '55.555.555/0001-55' },
    update: {},
    create: {
      name: 'ETEC Doutora Ruth Cardoso',
      taxId: '55.555.555/0001-55',
      slug: 'etec-ruth',
      systemId: ambraSystem.id,
      planId: plans[0].id,
      governmentId: gov.id,
      status: 'ACTIVE',
      canteens: {
        create: {
          name: 'Cantina do Tio João',
          type: 'COMMERCIAL',
          operatorId: opSeuJoao.id,
        }
      }
    }
  });

  // Cenário C: Escola Municipal
  // Fetch existing gov ID first
  const existingGov = await prisma.government.findUnique({ where: { slug: 'pref-sp-v4' } });
  
  const schoolMuni = await prisma.school.upsert({
    where: { taxId: '66.666.666/0001-66' },
    update: {},
    create: {
      name: 'EMEF Prefeito José Meirelles',
      taxId: '66.666.666/0001-66',
      slug: 'emef-meirelles',
      systemId: ambraSystem.id,
      planId: plans[0].id,
      governmentId: existingGov?.id || gov.id,
      status: 'ACTIVE',
      canteens: {
        create: [
          {
            name: 'Refeitório Merenda (Governo)',
            type: 'GOVERNMENTAL',
            operatorId: null,
          },
          {
            name: 'Quiosque de Lanches (Teresa)',
            type: 'COMMERCIAL',
            operatorId: opCatering.id,
          }
        ]
      }
    }
  });

  // 6. USUÁRIOS
  const admin = await prisma.user.upsert({
    where: { email: masterEmail },
    update: { passwordHash: hashedAdminPassword, role: UserRole.GLOBAL_ADMIN },
    create: {
      name: 'Gabriel Nodum Master',
      email: masterEmail,
      passwordHash: hashedAdminPassword,
      role: UserRole.GLOBAL_ADMIN,
    },
  });

  // 7. USUÁRIOS DE TESTE (AMBRA FLOW)
  console.log('👷 Semeando Usuários Operacionais...');

  const password123 = await bcrypt.hash('password123', saltRounds);

  // Manager (Colégio Elite)
  const managerElite = await prisma.user.upsert({
    where: { email: 'manager@elite.com' },
    update: { passwordHash: password123, role: UserRole.SCHOOL_ADMIN, schoolId: schoolElite.id },
    create: {
      name: 'Diretor Elite',
      email: 'manager@elite.com',
      passwordHash: password123,
      role: UserRole.SCHOOL_ADMIN,
      schoolId: schoolElite.id,
      termsAccepted: true,
      termsVersion: 'v1',
    },
  });

  // Operator (Colégio Elite)
  // Need to verify if UserRole has CANTEEN_OPERATOR
  const operatorElite = await prisma.user.upsert({
    where: { email: 'caixa@elite.com' },
    update: { passwordHash: password123, role: UserRole.CANTEEN_OPERATOR, schoolId: schoolElite.id },
    create: {
      name: 'Operador Caixa 01',
      email: 'caixa@elite.com',
      passwordHash: password123,
      role: UserRole.CANTEEN_OPERATOR,
      schoolId: schoolElite.id,
      termsAccepted: true,
      termsVersion: 'v1',
    },
  });

  // Student (Colégio Elite)
  const studentElite = await prisma.user.upsert({
    where: { email: 'aluno@elite.com' },
    update: { passwordHash: password123, role: UserRole.STUDENT, schoolId: schoolElite.id },
    create: {
      name: 'Aluno Teste',
      email: 'aluno@elite.com',
      passwordHash: password123,
      role: UserRole.STUDENT,
      schoolId: schoolElite.id,
      termsAccepted: true,
      termsVersion: 'v1',
    },
  });

  // Wallet for Student
  await prisma.wallet.upsert({
    where: { userId: studentElite.id },
    update: { balance: 150.00 },
    create: {
      userId: studentElite.id,
      balance: 150.00,
    }
  });

  console.log('✅ Usuários de Teste Criados:');
  console.log('- Manager: manager@elite.com / 123456');
  console.log('- Operator: caixa@elite.com / 123456');
  console.log('- Student: aluno@elite.com / 123456 (R$ 150,00)');
}

main()
  .catch((e) => {
    console.error('Error Message:', e.message);
    console.error('Error Stack:', e.stack);
    process.exit(1);
  })
  .finally(async () => {
    // Force close connections to prevent hanging
    try {
        await prisma.$disconnect();
        await pool.end();
        console.log('🔌 Conexões encerradas com sucesso.');
    } catch (err) {
        console.error('Erro ao encerrar conexões:', err);
        process.exit(1);
    }
    process.exit(0);
  });
