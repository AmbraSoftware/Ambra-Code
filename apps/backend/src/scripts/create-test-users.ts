import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Criando usuários de teste para Ambra Food...');

  const saltRounds = 10;
  const password = 'senha123'; // Senha simples para testes
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Buscar escola Elite
  const schoolElite = await prisma.school.findFirst({
    where: { slug: 'colegio-elite' },
  });

  if (!schoolElite) {
    console.error('❌ Escola Elite não encontrada. Execute o seed primeiro.');
    return;
  }

  // 1. ALUNO
  const student = await prisma.user.upsert({
    where: { email: 'aluno@teste.com' },
    update: {
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      roles: [UserRole.STUDENT],
    },
    create: {
      name: 'João da Silva',
      email: 'aluno@teste.com',
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      roles: [UserRole.STUDENT],
      schoolId: schoolElite.id,
      termsAccepted: true,
      termsVersion: 'v1',
    },
  });

  // Carteira do Aluno
  await prisma.wallet.upsert({
    where: { userId: student.id },
    update: { balance: 50.0 },
    create: {
      userId: student.id,
      balance: 50.0,
    },
  });

  // 2. RESPONSÁVEL (GUARDIAN)
  const guardian = await prisma.user.upsert({
    where: { email: 'pai@teste.com' },
    update: {
      passwordHash: hashedPassword,
      role: UserRole.GUARDIAN,
      roles: [UserRole.GUARDIAN],
    },
    create: {
      name: 'Maria da Silva',
      email: 'pai@teste.com',
      passwordHash: hashedPassword,
      role: UserRole.GUARDIAN,
      roles: [UserRole.GUARDIAN],
      schoolId: schoolElite.id,
      termsAccepted: true,
      termsVersion: 'v1',
    },
  });

  // Carteira do Responsável
  await prisma.wallet.upsert({
    where: { userId: guardian.id },
    update: { balance: 200.0 },
    create: {
      userId: guardian.id,
      balance: 200.0,
    },
  });

  console.log('\n✅ USUÁRIOS CRIADOS COM SUCESSO!\n');
  console.log('📱 ALUNO:');
  console.log('   Email: aluno@teste.com');
  console.log('   Senha: senha123');
  console.log('   Saldo: R$ 50,00');
  console.log('');
  console.log('👨‍👩‍👧‍👦 RESPONSÁVEL:');
  console.log('   Email: pai@teste.com');
  console.log('   Senha: senha123');
  console.log('   Saldo: R$ 200,00');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
