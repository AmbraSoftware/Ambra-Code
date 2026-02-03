import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  try {
    const wallet = await prisma.wallet.findFirst({
      select: { id: true, balance: true, user: { select: { name: true, email: true } } }
    });
    
    if (wallet) {
      console.log('\n=== WALLET FOUND ===');
      console.log('ID:', wallet.id);
      console.log('Balance:', wallet.balance);
      console.log('User:', wallet.user.name, '-', wallet.user.email);
      console.log('\nUse this ID for smoke tests:');
      console.log(`WALLET_ID=${wallet.id}`);
    } else {
      console.log('No wallets found in database');
    }
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
