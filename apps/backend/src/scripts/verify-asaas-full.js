"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const tenancy_service_1 = require("../src/modules/tenancy/tenancy.service");
const asaas_service_1 = require("../src/modules/asaas/asaas.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('AsaasVerification');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const tenancyService = app.get(tenancy_service_1.TenancyService);
    const asaasService = app.get(asaas_service_1.AsaasService);
    const prisma = app.get(prisma_service_1.PrismaService);
    logger.log('🚀 Starting Full Asaas Verification Flow...');
    try {
        const slug = `school-verify-${Date.now()}`;
        const taxId = `${Date.now().toString().slice(-14)}`;
        logger.log(`1. Creating Test School: ${slug}`);
        const schoolData = {
            name: 'Escola Modelo Verify',
            taxId: taxId,
            slug: slug,
            systemId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            planId: 'f1e2d3c4-b5a6-4978-8fec-1a2b3c4d5e6f',
            adminName: 'Diretor Teste',
            adminEmail: `diretor.${slug}@test.com`,
            adminPassword: 'securePass123'
        };
        const system = await prisma.platformSystem.findFirst();
        const plan = await prisma.plan.findFirst();
        if (!system || !plan) {
            throw new Error('Ecosystem empty. Run seeds first.');
        }
        schoolData.systemId = system.id;
        schoolData.planId = plan.id;
        const result = await tenancyService.createSchoolWithAdmin(schoolData);
        logger.log(`✅ School Created: ${result.schoolId}`);
        logger.log('2. Waiting for Asaas Subscription Async Creation...');
        await new Promise(r => setTimeout(r, 5000));
        const school = await prisma.school.findUnique({ where: { id: result.schoolId } });
        if (school?.subscriptionId) {
            logger.log(`✅ School Subscription Verified: ${school.subscriptionId}`);
        }
        else {
            logger.warn('⚠️ Subscription ID missing. Asaas Sync might have failed or is disabled in Sandbox.');
        }
        logger.log('3. Testing Split Logic (Recharge)');
        const operator = await prisma.operator.create({
            data: {
                name: 'Cantina Verify Ltda',
                taxId: `${Date.now()}00`,
                asaasId: 'wallet_mock_operator_123',
                asaasWalletId: '26e84321-6543-2109-8765-432109876543'
            }
        });
        const splitPayload = {
            customer: '00000000000',
            value: 50.00,
            walletId: operator.asaasWalletId || 'wallet_fallback',
            description: 'Recarga Teste Split'
        };
        const charge = await asaasService.createPixCharge(splitPayload);
        if (charge.netValue === 45.00) {
            logger.log(`✅ Split Verified: Net Value is R$ 45.00 (R$ 50.00 - R$ 5.00 Fee).`);
            logger.log(`   Asaas Payload ID: ${charge.id}`);
        }
        else {
            logger.error(`❌ Split Failed. Net Value: ${charge.netValue}`);
        }
    }
    catch (error) {
        logger.error('Verification Failed', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=verify-asaas-full.js.map