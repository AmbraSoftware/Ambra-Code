import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/modules/orders/orders.service';
import { PrismaService } from '../src/prisma/prisma.service';

import { User } from '@prisma/client';

describe('Commerce Stress Test (E2E)', () => {
  let app: INestApplication;
  let ordersService: OrdersService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    ordersService = app.get<OrdersService>(OrdersService);
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('RACE CONDITION: Should only allow 1 purchase for the last item in stock', async () => {
    // 1. Setup Data directly in DB
    const school = await prisma.school.findFirst();
    if (!school) {
      console.warn('No school found, skipping test');
      return;
    }

    const canteen = await prisma.canteen.create({
      data: { name: 'Stress Canteen', schoolId: school.id, type: 'COMMERCIAL' },
    });

    const product = await prisma.product.create({
      data: {
        name: 'Stress Bar',
        price: 1.0,
        stock: 1, // CRITICAL: Only 1
        category: 'TEST',
        canteenId: canteen.id,
        schoolId: school.id,
        version: 0,
      },
    });

    // Create 5 Students with wallets
    const students: User[] = [];
    for (let i = 0; i < 5; i++) {
      const user = await prisma.user.create({
        data: {
          name: `Racer ${i}`,
          email: `racer${i}-${Date.now()}@test.com`,
          passwordHash: 'hash',
          schoolId: school.id,
        },
      });
      await prisma.wallet.create({
        data: { userId: user.id, balance: 1000, version: 0 },
      });
      students.push(user);
    }

    // 2. Attack
    const attackPromises = students.map((student) =>
      ordersService
        .create(student.id, {
          studentId: student.id,
          items: [{ productId: product.id, quantity: 1 }],
        })
        .then(() => 'SUCCESS')
        .catch((e) => 'FAILED'),
    );

    const results = await Promise.all(attackPromises);
    const successCount = results.filter((r) => r === 'SUCCESS').length;
    const failCount = results.filter((r) => r === 'FAILED').length;

    console.log('--- RACE RESULTS ---', results);

    // 3. Assert
    expect(successCount).toBe(1);
    expect(failCount).toBe(4);

    // Verify Stock
    const finalProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    expect(finalProduct?.stock).toBe(0);
  }, 30000); // 30s timeout
});
