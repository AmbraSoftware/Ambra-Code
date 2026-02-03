import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { RiskService } from '../modules/risk/risk.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { TransactionType, TransactionStatus } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const riskService = app.get(RiskService);
  const prisma = app.get(PrismaService);
  const logger = new Logger('RiskVerification');

  logger.log('🚀 Starting Risk Module Verification...');

  try {
    const testSuffix = Math.floor(Math.random() * 10000);

    // 1. Create a "Good" User (High Score Potential)
    const goodUser = await prisma.user.create({
      data: {
        name: `Good Payer ${testSuffix}`,
        email: `good_${testSuffix}@risk.test`,
        passwordHash: 'pass',
        role: 'GUARDIAN',
        createdAt: new Date(new Date().getTime() - 100 * 24 * 3600 * 1000), // 100 days old (+100)
        wallet: {
          create: {
            balance: 500, // > 100 (+50)
            dailySpendLimit: 100,
            allowedDays: [1],
          },
        },
      },
      include: { wallet: true }, // Return the wallet to retrieve its ID
    });

    if (!goodUser.wallet) throw new Error('Wallet not created');

    // Seed 15 Transactions (+50)
    await prisma.transaction.createMany({
      data: Array(15)
        .fill(null)
        .map((_, i) => ({
          userId: goodUser.id,
          walletId: goodUser.wallet!.id, // Use valid UUID
          amount: 10,
          netAmount: 10, // Added to satisfy required field
          runningBalance: 500, // Added to satisfy required field
          type: TransactionType.PURCHASE,
          status: TransactionStatus.COMPLETED,
          description: `Tx ${i}`,
        })),
    });

    // NOTE: The `_count.transactions` in RiskService relies on relations.
    // createMany might not link if we don't handle relations carefully or if `userId` is enough.
    // In schema `Transaction` has `userId`.

    logger.log(`Analyzing Good User: ${goodUser.email}`);
    const goodAnalysis = await riskService.calculateInternalScore(goodUser.id);

    logger.log(`>> Score: ${goodAnalysis.score}`);
    logger.log(`>> Level: ${goodAnalysis.riskLevel}`);
    logger.log(`>> Details: ${JSON.stringify(goodAnalysis.details)}`);

    if (goodAnalysis.score >= 650) {
      // 500 base + 100 tenure + 50 volume + 50 balance = 700
      logger.log('✅ Internal Score Logic Verified (Good User)');
    } else {
      logger.error('❌ Internal Score Logic Mismatch');
    }

    // 2. Test External Mock
    logger.log('Testing External Serasa Mock...');
    const cpfGood = '12345678909'; // Ends in 9 -> Score 900
    const cpfBad = '12345678901'; // Ends in 1 -> Score 300

    const extGood = await riskService.consultExternalSerasa(cpfGood);
    logger.log(
      `External Good (${cpfGood}): ${extGood.score} [${extGood.riskLevel}]`,
    );

    const extBad = await riskService.consultExternalSerasa(cpfBad);
    logger.log(
      `External Bad (${cpfBad}): ${extBad.score} [${extBad.riskLevel}]`,
    );

    if (extGood.score === 900 && extBad.score === 300) {
      logger.log('✅ External Mock Logic Verified');
    } else {
      logger.error('❌ External Mock Logic Mismatch');
    }
  } catch (error) {
    logger.error('Test Failed', error);
  } finally {
    // cleanup
    await app.close();
  }
}

bootstrap();
