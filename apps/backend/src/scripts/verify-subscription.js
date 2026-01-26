"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const tenancy_service_1 = require("../src/modules/tenancy/tenancy.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const tenancyService = app.get(tenancy_service_1.TenancyService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const logger = new common_1.Logger('SubscriptionVerification');
    const generateCPF = () => {
        const rnd = (n) => Math.round(Math.random() * n);
        const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
        const n = 9;
        const n1 = rnd(n), n2 = rnd(n), n3 = rnd(n), n4 = rnd(n), n5 = rnd(n), n6 = rnd(n), n7 = rnd(n), n8 = rnd(n), n9 = rnd(n);
        let d1 = n1 * 10 + n2 * 9 + n3 * 8 + n4 * 7 + n5 * 6 + n6 * 5 + n7 * 4 + n8 * 3 + n9 * 2;
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10)
            d1 = 0;
        let d2 = n1 * 11 + n2 * 10 + n3 * 9 + n4 * 8 + n5 * 7 + n6 * 6 + n7 * 5 + n8 * 4 + n9 * 3 + d1 * 2;
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10)
            d2 = 0;
        return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
    };
    logger.log('🚀 Starting SaaS Subscription Verification Check...');
    try {
        const testSuffix = Math.floor(Math.random() * 10000);
        const system = await prisma.platformSystem.upsert({
            where: { slug: 'sys-subs-test' },
            create: { name: 'Subscription Sys', slug: 'sys-subs-test', status: 'ACTIVE' },
            update: {}
        });
        let plan = await prisma.plan.findFirst({ where: { name: 'SaaS Pro' } });
        if (!plan) {
            plan = await prisma.plan.create({
                data: { name: 'SaaS Pro', price: 199.90, status: 'ACTIVE' }
            });
        }
        const validCPF = generateCPF();
        const schoolDto = {
            name: `School Subscription Test ${testSuffix}`,
            taxId: validCPF,
            slug: `school-subs-${testSuffix}`,
            systemId: system.id,
            planId: plan.id,
            adminName: 'Admin SaaS',
            adminEmail: `admin_saas_${testSuffix}@test.com`,
            adminPassword: 'password123'
        };
        logger.log(`Creating School: ${schoolDto.name} (${validCPF})...`);
        const result = await tenancyService.createSchoolWithAdmin(schoolDto);
        logger.log(`School Created: ${result.schoolId}`);
        logger.log('Waiting for async Asaas Provisioning...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const school = await prisma.school.findUnique({
            where: { id: result.schoolId }
        });
        if (school && school.asaasCustomerId && school.subscriptionId) {
            logger.log(`✅ Success! Linked to Asaas Customer: ${school.asaasCustomerId}`);
            logger.log(`✅ Success! Linked to Subscription: ${school.subscriptionId} (Status: ${school.status})`);
        }
        else {
            logger.error('❌ Failed! School missing Asaas fields.');
            logger.error(`   Customer: ${school?.asaasCustomerId}`);
            logger.error(`   Subscription: ${school?.subscriptionId}`);
        }
    }
    catch (error) {
        logger.error('Test Failed', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=verify-subscription.js.map