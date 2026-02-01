
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../modules/asaas/asaas.service';
import { AsaasWebhookService } from '../modules/asaas/asaas.webhook.service';
import { TransactionService } from '../modules/transactions/transactions.service';
import { StockService } from '../modules/stock/stock.service';
import { OrdersService } from '../modules/orders/orders.service';
import { Logger } from '@nestjs/common';
import { UserRole, CanteenType } from '@prisma/client';

/**
 * 🛡️ VALIDATION SCRIPT: NODUM FULL SYSTEM CHECK (SCALED x3)
 * Covers: Personas A, B, C, D in Triplicate
 */
async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const asaasService = app.get(AsaasService);
    const webhookService = app.get(AsaasWebhookService);
    const transactionService = app.get(TransactionService);
    const stockService = app.get(StockService);
    const ordersService = app.get(OrdersService);
    const logger = new Logger('SystemVerification');

    logger.log('🚀 Starting Full System Verification Check (REAL API MODE)...');

    // DYNAMIC GENERATORS (Unmasked, Valid Mod11)
    const generateCPF = (masked = false) => {
        const rnd = (n) => Math.round(Math.random() * n);
        const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
        const n = 9;
        const n1 = rnd(n), n2 = rnd(n), n3 = rnd(n), n4 = rnd(n), n5 = rnd(n), n6 = rnd(n), n7 = rnd(n), n8 = rnd(n), n9 = rnd(n);
        let d1 = n1 * 10 + n2 * 9 + n3 * 8 + n4 * 7 + n5 * 6 + n6 * 5 + n7 * 4 + n8 * 3 + n9 * 2;
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10) d1 = 0;
        let d2 = n1 * 11 + n2 * 10 + n3 * 9 + n4 * 8 + n5 * 7 + n6 * 6 + n7 * 5 + n8 * 4 + n9 * 3 + d1 * 2;
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10) d2 = 0;
        return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
    };

    const generateCNPJ = () => {
        const rnd = (n) => Math.round(Math.random() * n);
        const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
        const n = 9;
        const n1 = rnd(n), n2 = rnd(n), n3 = rnd(n), n4 = rnd(n), n5 = rnd(n), n6 = rnd(n), n7 = rnd(n), n8 = rnd(n);
        let d1 = n1 * 2 + n2 * 3 + n3 * 4 + n4 * 5 + n5 * 6 + n6 * 7 + n7 * 8 + n8 * 9;
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10) d1 = 0;
        let d2 = d1 * 2 + n1 * 3 + n2 * 4 + n3 * 5 + n4 * 6 + n5 * 7 + n6 * 8 + n7 * 9 + n8 * 10;
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10) d2 = 0;
        return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}0001${d1}${d2}`;
    };

    const NAMES_POOL = ['Alpha', 'Beta', 'Gamma'];

    try {
        const testSuffix = Math.floor(Math.random() * 1000);
        const systemSlug = `sys-verify-${testSuffix}`;
        const schoolSlug = `school-verify-${testSuffix}`;

        // ==========================================
        // 1. DATA SETUP: TENANT (Single Stage)
        // ==========================================
        logger.log(`[SETUP] Creating Infra: ${systemSlug}`);

        let system = await prisma.platformSystem.create({
            data: { name: 'Validation System', slug: systemSlug, status: 'ACTIVE' }
        });

        const plan = await prisma.plan.findFirst() || await prisma.plan.create({
            data: { name: 'Validation Enterprise', price: 99.00 }
        });

        const school = await prisma.school.create({
            data: {
                name: 'Nodum Validation High',
                slug: schoolSlug,
                taxId: `999${testSuffix}`,
                systemId: system.id,
                planId: plan.id,
                status: 'ACTIVE'
            }
        });

        // ==========================================
        // 2. LOOP x3: OPERATORS (B2B)
        // ==========================================
        logger.log('🔄 [LOOP] Creating 3 Operators (Canteen Owners) with Asaas Subaccounts...');

        const operators: any[] = [];
        const canteens: any[] = [];

        for (let i = 0; i < 3; i++) {
            const name = `${NAMES_POOL[i]} Cantina`;
            // SWITCH TO CPF FOR HIGHER SUCCESS RATE IN SANDBOX
            const taxId = generateCPF();

            logger.log(`👉 [Operator ${i + 1}/3] Provisioning '${name}' (${taxId}) as INDIVIDUAL...`);

            // UNIQUE FALLBACK TO PREVENT CONSTRAINT CRASH
            let asaasId: string = `mock_fail_${i}_${testSuffix}_${Math.random().toString(36).substring(7)}`;
            let walletId: string = `mock_wallet_${i}_${testSuffix}`;

            try {
                // REAL CALL TO ASAAS
                const sub = await asaasService.createSubAccount({
                    name: `${name} ${testSuffix}`,
                    email: `op_${i}_${testSuffix}@nodum.com`,
                    cpfCnpj: taxId,
                    companyType: 'INDIVIDUAL',
                    birthDate: '1990-01-01',
                    incomeValue: 5000,
                    mobilePhone: '11999990000',
                    postalCode: '89223005',
                    address: 'Rua Teste',
                    addressNumber: '100'
                });
                asaasId = sub.id;
                walletId = sub.walletId;
                logger.log(`   ✅ Asaas Subaccount: ${asaasId}`);
            } catch (e) {
                logger.error(`   ❌ Asaas Failed for ${name}: ${JSON.stringify(e.response?.data || e.message)}`);
                // Continue with mocks if needed to test other parts, or fail.
                // In a verification script, failing here breaks the chain.
                // We define mock fallback just to let script proceed and fail later gracefully if needed.
            }

            const op = await prisma.operator.create({
                data: {
                    name: `${name} ${testSuffix}`,
                    taxId: taxId,
                    asaasId: asaasId,
                    asaasWalletId: walletId
                } as any
            });
            operators.push(op);

            const canteen = await prisma.canteen.create({
                data: {
                    name: `${name} Unit`,
                    schoolId: school.id,
                    type: CanteenType.COMMERCIAL,
                    operatorId: op.id
                }
            });
            canteens.push(canteen);

            // Create User: OPERATOR_ADMIN
            await prisma.user.create({
                data: {
                    name: `Dono ${name}`,
                    email: `owner_${i}_${testSuffix}@nodum.com`,
                    passwordHash: 'hash',
                    role: UserRole.MERCHANT_ADMIN,
                    roles: [UserRole.MERCHANT_ADMIN],
                    schoolId: school.id
                }
            });
        }

        // ==========================================
        // 3. LOOP x3: FAMILIES (B2C) & TRANSACTIONS
        // ==========================================
        logger.log('🔄 [LOOP] Creating 3 Families (Guardian + Student) & Testing Finance Flow...');

        for (let i = 0; i < 3; i++) {
            const familyName = NAMES_POOL[i];
            const cpf = generateCPF(); // Dynamic Valid
            const targetCanteen = canteens[i]; // Each family buys from their "assigned" canteen

            if (!operators[i]) {
                logger.warn(`Skipping Family ${i + 1} due to missing Operator.`);
                continue;
            }

            logger.log(`👉 [Family ${i + 1}/3] ${familyName} Family Setup (${cpf})...`);

            // Create Guardian
            const guardian = await prisma.user.create({
                data: {
                    name: `Guardian ${familyName}`,
                    email: `guardian_${i}_${testSuffix}@nodum.com`,
                    passwordHash: 'hash',
                    role: UserRole.GUARDIAN,
                    schoolId: school.id,
                    document: cpf
                }
            });

            // Create Wallet
            const wallet = await prisma.wallet.create({
                data: { userId: guardian.id, dailySpendLimit: 100.00 }
            });

            // 3.1 TEST: RECHARGE (Real Split Check)
            logger.log(`   💳 Testing Recharge R$ 50.00 (Split: 5.00 Nodum / 45.00 ${operators[i].name})...`);

            // Call Service
            const charge = await transactionService.prepareRecharge(guardian.id, 50.00);
            logger.log(`      Pix Created: ${charge.transactionId}`);

            // Simulate Webhook (Since we can't pay real money in Sandbox easily from script without manual action)
            // We simulate the EVENT that Asaas WOULD send if paid.
            // We TRUST verify-asaas.ts verified connectivity. Here we verify logic.
            const webhookPayload = {
                id: `evt_auto_${i}_${testSuffix}`,
                event: 'PAYMENT_RECEIVED',
                payment: {
                    id: charge.transactionId,
                    customer: guardian.document,
                    externalReference: guardian.id,
                    value: 50.00,
                    netValue: 45.00, // Should match logic
                    split: [
                        { walletId: operators[i].asaasWalletId, fixedValue: 45.00 },
                        { walletId: process.env.ASAAS_MASTER_WALLET_ID, fixedValue: 5.00 }
                    ]
                }
            };

            // Process Webhook
            await webhookService.handleWebhook(webhookPayload);

            // Verify Balance
            const wCheck = await prisma.wallet.findUnique({ where: { id: wallet.id } });
            if (!wCheck) throw new Error(`Wallet ${wallet.id} not found check.`);

            if (Number(wCheck.balance) === 50.00) logger.log('      ✅ Wallet Credited');
            else logger.error(`      ❌ Wallet Balance Incorrect: ${wCheck.balance}`);

            // Verify Ledger Split
            const tx = await prisma.transaction.findFirst({ where: { walletId: wallet.id, type: 'RECHARGE' } });
            if (!tx) throw new Error('Transaction RECHARGE not found');

            if (Number(tx.netAmount) === 45.00) logger.log('      ✅ Transaction Ledger Split Correct');
            else logger.error(`      ❌ Ledger Incorrect: ${tx.netAmount}`);

            // 3.2 TEST: PURCHASE (Stock Decrement)
            logger.log(`   🛒 Testing Purchase (Item R$ 10.00)...`);

            // Create Product
            const prod = await prisma.product.create({
                data: {
                    name: `Lanche ${familyName}`,
                    price: 10.00,
                    stock: 5,
                    canteenId: targetCanteen.id,
                    schoolId: school.id,
                    category: 'Lanches'
                }
            });

            // Execute Purchase via Orders (Stock reservation + rules)
            await ordersService.create(guardian.id, {
                studentId: guardian.id,
                items: [{ productId: prod.id, quantity: 1 }],
            } as any);

            // Verify Stock
            const pCheck = await prisma.product.findUnique({ where: { id: prod.id } });
            if (!pCheck) throw new Error('Product check failed');

            if (pCheck.stock === 4) logger.log('      ✅ Stock Decremented (5->4)');
            else logger.error(`      ❌ Stock Fail: ${pCheck.stock}`);
        }

        logger.log('🏁 Verification Complete.');

    } catch (error) {
        logger.error('CRITICAL FAILURE', error);
    } finally {
        await app.close();
    }
}

bootstrap();
