
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TenancyService } from '../modules/tenancy/tenancy.service';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const tenancyService = app.get(TenancyService);
    const prisma = app.get(PrismaService);
    const logger = new Logger('SubscriptionVerification');

    const generateCPF = () => {
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

    logger.log('🚀 Starting SaaS Subscription Verification Check...');

    try {
        const testSuffix = Math.floor(Math.random() * 10000);

        // Ensure System (Upsert OK for unique slug)
        const system = await prisma.platformSystem.upsert({
            where: { slug: 'sys-subs-test' },
            create: { name: 'Subscription Sys', slug: 'sys-subs-test', status: 'ACTIVE' },
            update: {}
        });

        // Ensure Plan (Name NOT unique, use findFirst)
        let plan = await prisma.plan.findFirst({ where: { name: 'SaaS Pro' } });
        if (!plan) {
            plan = await prisma.plan.create({
                data: { name: 'SaaS Pro', price: 199.90, status: 'ACTIVE' }
            });
        }

        // Use valid CPF
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

        // This should trigger the subscription creation in TenancyService
        const result = await tenancyService.createSchoolWithAdmin(schoolDto);

        logger.log(`School Created: ${result.schoolId}`);

        // Wait a bit for async post-hook to complete
        logger.log('Waiting for async Asaas Provisioning...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Use 'any' cast to bypass outdated Prisma types if necessary
        const school: any = await prisma.school.findUnique({
            where: { id: result.schoolId }
        });

        if (school && school.asaasCustomerId && school.subscriptionId) {
            logger.log(`✅ Success! Linked to Asaas Customer: ${school.asaasCustomerId}`);
            logger.log(`✅ Success! Linked to Subscription: ${school.subscriptionId} (Status: ${school.status})`);
        } else {
            logger.error('❌ Failed! School missing Asaas fields.');
            logger.error(`   Customer: ${school?.asaasCustomerId}`);
            logger.error(`   Subscription: ${school?.subscriptionId}`);
        }

    } catch (error) {
        logger.error('Test Failed', error);
    } finally {
        await app.close();
    }
}

bootstrap();
