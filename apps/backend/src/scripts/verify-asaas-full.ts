
// scripts/verify-asaas-full.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenancyService } from '../modules/tenancy/tenancy.service';
import { AsaasService } from '../modules/asaas/asaas.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('AsaasVerification');
    const app = await NestFactory.createApplicationContext(AppModule);

    const tenancyService = app.get(TenancyService);
    const asaasService = app.get(AsaasService);
    const prisma = app.get(PrismaService);

    logger.log('🚀 Starting Full Asaas Verification Flow...');

    try {
        // 1. Setup: Clean State Mock
        const slug = `school-verify-${Date.now()}`;
        const taxId = `${Date.now().toString().slice(-14)}`; // Pseudo CNPJ

        logger.log(`1. Creating Test School: ${slug}`);

        // Simulating DTO
        const schoolData = {
            name: 'Escola Modelo Verify',
            taxId: taxId,
            slug: slug,
            systemId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', // MOCK ID - Replace with real DB ID if needed or fetch
            planId: 'f1e2d3c4-b5a6-4978-8fec-1a2b3c4d5e6f',   // MOCK ID
            adminName: 'Diretor Teste',
            adminEmail: `diretor.${slug}@test.com`,
            adminPassword: 'securePass123'
        };

        // Need real IDs for System and Plan to work with foreign keys
        const system = await prisma.platformSystem.findFirst();
        const plan = await prisma.plan.findFirst();

        if (!system || !plan) {
            throw new Error('Ecosystem empty. Run seeds first.');
        }

        schoolData.systemId = system.id;
        schoolData.planId = plan.id;

        const result = await tenancyService.createSchoolWithAdmin(schoolData);
        logger.log(`✅ School Created: ${result.schoolId}`);

        // 2. Verify Subscription in Asaas (Check DB field updated by post-hook)
        // Post-hook is async, so we wait a bit
        logger.log('2. Waiting for Asaas Subscription Async Creation...');
        await new Promise(r => setTimeout(r, 5000));

        const school = await prisma.school.findUnique({ where: { id: result.schoolId } });
        if (school?.subscriptionId) {
            logger.log(`✅ School Subscription Verified: ${school.subscriptionId}`);
        } else {
            logger.warn('⚠️ Subscription ID missing. Asaas Sync might have failed or is disabled in Sandbox.');
        }

        // 3. Setup Operator and Split Logic
        logger.log('3. Testing Split Logic (Recharge)');

        // Create Operator Mock
        const operator = await prisma.operator.create({
            data: {
                name: 'Cantina Verify Ltda',
                taxId: `${Date.now()}00`,
                asaasId: 'wallet_mock_operator_123', // MOCK for dev
                asaasWalletId: '26e84321-6543-2109-8765-432109876543' // MOCK
            }
        });

        // Simulate Recharge
        const splitPayload = {
            customer: '00000000000', // CPF Mock
            value: 50.00,
            walletId: operator.asaasWalletId || 'wallet_fallback',
            description: 'Recarga Teste Split'
        };

        const charge = await asaasService.createPixCharge(splitPayload);

        if (charge.netValue === 45.00) {
            logger.log(`✅ Split Verified: Net Value is R$ 45.00 (R$ 50.00 - R$ 5.00 Fee).`);
            logger.log(`   Asaas Payload ID: ${charge.id}`);
        } else {
            logger.error(`❌ Split Failed. Net Value: ${charge.netValue}`);
        }

    } catch (error) {
        logger.error('Verification Failed', error);
    } finally {
        await app.close();
    }
}

bootstrap();
