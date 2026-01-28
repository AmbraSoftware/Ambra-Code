import * as dotenv from 'dotenv';
dotenv.config({ path: 'apps/backend/.env' }); // Standard path

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, CanteenType } from '@prisma/client';

async function bootstrap() {
    // Ensuring App Context loads with Env Vars
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const logger = new Logger('CreateOperatorManual');

    try {
        logger.log('🚀 Starting Manual Operator Creation (Nest Context)...');

        // 1. Ensure System & Plan exist
        let system = await prisma.platformSystem.findFirst();
        if (!system) {
            system = await prisma.platformSystem.create({
                data: { name: 'Nodum Test System', slug: 'nodum-test' }
            });
        }

        let plan = await prisma.plan.findFirst();
        if (!plan) {
            plan = await prisma.plan.create({
                data: { name: 'Standard Plan', price: 100 }
            });
        }

        // 2. Create Operator Entity (The Business)
        const operatorTaxId = '34.567.890/0001-12';
        let operator = await prisma.operator.findUnique({ where: { taxId: operatorTaxId } });

        if (!operator) {
            operator = await prisma.operator.create({
                data: {
                    name: 'Cantina Manual Agent Ltda',
                    taxId: operatorTaxId,
                }
            });
            logger.log(`✅ Operator Entity Created: ${operator.id}`);
        } else {
            logger.log(`ℹ️ Operator Entity found: ${operator.id}`);
        }

        // 3. Create School
        const schoolSlug = 'escola-agent-manual-' + Math.floor(Math.random() * 100000);
        const school = await prisma.school.create({
            data: {
                name: 'Escola Teste Agent Manual',
                slug: schoolSlug,
                taxId: '12.345.678/0001-' + Math.floor(Math.random() * 90 + 10),
                systemId: system.id,
                planId: plan.id
            }
        });
        logger.log(`✅ School Created: ${school.name}`);

        // 4. Create Canteen linked to Operator
        const canteen = await prisma.canteen.create({
            data: {
                name: 'Cantina Principal',
                schoolId: school.id,
                operatorId: operator.id,
                type: CanteenType.COMMERCIAL
            }
        });
        logger.log(`✅ Canteen Created: ${canteen.id}`);

        // 5. Create User (Operator Admin)
        const passwordRaw = 'Password123!';
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(passwordRaw, salt);

        const userEmail = `operator_manual_${Math.floor(Math.random() * 10000)}@test.com`;

        const user = await prisma.user.create({
            data: {
                name: 'Operador Manual Agent',
                email: userEmail,
                passwordHash: hash,
                role: UserRole.MERCHANT_ADMIN,
                roles: [UserRole.MERCHANT_ADMIN],
                canteenId: canteen.id,
                schoolId: school.id
            }
        });

        logger.log('==========================================');
        logger.log('🎉 OPERATOR ACCOUNT CREATED SUCCESSFULLY');
        logger.log(`📧 Email: ${userEmail}`);
        logger.log(`🔑 Password: ${passwordRaw}`);
        logger.log('==========================================');

    } catch (error) {
        logger.error('❌ Failed to create operator', error);
    } finally {
        await app.close();
    }
}

bootstrap();
