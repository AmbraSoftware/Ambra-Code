// scripts/verify-commerce-full.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrdersService } from '../modules/orders/orders.service';
import { StockService } from '../modules/stock/stock.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

async function bootstrap() {
  const logger = new Logger('CommerceVerification');
  const app = await NestFactory.createApplicationContext(AppModule);

  const ordersService = app.get(OrdersService);
  const stockService = app.get(StockService);
  const prisma = app.get(PrismaService);

  logger.log('🚀 Starting Commerce Stress Test...');

  try {
    // 1. Setup Data
    const school = await prisma.school.findFirst();
    const student = await prisma.user.findFirst({
      where: { role: 'STUDENT', schoolId: school?.id },
    });
    const canteen = await prisma.canteen.findFirst({
      where: { schoolId: school?.id },
    });

    if (!student || !canteen) throw new Error('Seed data missing');

    // Create Test Product
    const product = await prisma.product.create({
      data: {
        name: 'Stress Test Bar',
        price: 5.0,
        stock: 1, // CRITICAL: Only 1 item in stock
        category: 'SNACK',
        canteenId: canteen.id,
        schoolId: school!.id,
        isAvailable: true,
      },
    });

    logger.log(
      `1. Created Product "${product.name}" with Stock: ${product.stock}`,
    );

    // 2. Race Condition Test (The "Industrial Standard" test)
    logger.log(
      '2. Running Parallel Purchase Attack (5 concurrent requests for 1 item)...',
    );

    // Make sure wallet has balance
    await prisma.wallet.update({
      where: { userId: student.id },
      data: { balance: 1000 },
    });

    const tasks = Array.from({ length: 5 }).map(async (_, index) => {
      try {
        await ordersService.create(student.id, {
          studentId: student.id,
          items: [{ productId: product.id, quantity: 1 }],
        });
        return { status: 'SUCCESS', index };
      } catch (e) {
        return { status: 'FAILED', index, reason: e.message };
      }
    });

    const results = await Promise.all(tasks);

    const successes = results.filter((r) => r.status === 'SUCCESS');
    const failures = results.filter((r) => r.status === 'FAILED');

    logger.log('--- Race Condition Results ---');
    logger.log(`Attempts: ${results.length}`);
    logger.log(`Successes: ${successes.length} (Should be EXACTLY 1)`);
    logger.log(`Failures: ${failures.length}`);

    if (successes.length === 1 && failures.length === 4) {
      logger.log('✅ PASS: Atomic Transaction Isolation Held perfectly.');
    } else {
      logger.error('❌ FAIL: Race condition detected or Logic error.');
    }

    // 3. Verify Final Stock State
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    logger.log(`Final Real Stock: ${finalProduct?.stock} (Should be 0)`);
  } catch (error) {
    logger.error('Verification Failed', error);
  } finally {
    await app.close();
  }
}

bootstrap();
