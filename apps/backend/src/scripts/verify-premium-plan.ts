import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  try {
    // Check for GUARDIAN_PREMIUM plan
    const premiumPlan = await prisma.plan.findFirst({
      where: { target: 'GUARDIAN_PREMIUM', status: 'ACTIVE' },
    });

    if (premiumPlan) {
      console.log('✅ Plano GUARDIAN_PREMIUM encontrado:');
      console.log(`   ID: ${premiumPlan.id}`);
      console.log(`   Nome: ${premiumPlan.name}`);
      console.log(`   Preço: R$ ${premiumPlan.price}`);
      console.log(`   Target: ${premiumPlan.target}`);
    } else {
      console.log('❌ Plano GUARDIAN_PREMIUM não encontrado!');
      console.log('   Criando plano padrão...');

      const newPlan = await prisma.plan.create({
        data: {
          name: 'Ambra Food Premium',
          description: 'Acesso ilimitado ao SOS Merenda e taxa zero em recargas',
          price: 9.90,
          status: 'ACTIVE',
          target: 'GUARDIAN_PREMIUM',
          feesConfig: {},
        },
      });

      console.log('✅ Plano criado:');
      console.log(`   ID: ${newPlan.id}`);
      console.log(`   Nome: ${newPlan.name}`);
      console.log(`   Preço: R$ ${newPlan.price}`);
    }

    // Check all plans
    console.log('\n📋 Todos os planos ativos:');
    const allPlans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, price: true, target: true },
    });

    allPlans.forEach((plan) => {
      console.log(`   - ${plan.name} (${plan.target}): R$ ${plan.price} [${plan.id}]`);
    });

  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
