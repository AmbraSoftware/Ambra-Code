import * as dotenv from 'dotenv';
// Adjust path to point to .env in apps/backend root relative to this script
// This script is in apps/backend/src/scripts/
// .env is in apps/backend/.env
// So path should be '../../.env' relative to this file, or absolute.
// But dotenv takes path relative to CWD usually.
// I will try to load from default locations or explicit path.
dotenv.config({ path: '.env' }); 

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import * as fs from 'fs';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const logger = new Logger('CreateOperatorUnlinked');

    try {
        logger.log('🚀 Creating Unlinked Operator (for testing Link School)...');

        const passwordRaw = 'Password@123';
        const salt = await bcrypt.genSalt();
        const hash = await bcrypt.hash(passwordRaw, salt);

        const userEmail = `operator_unlinked_${Math.floor(Math.random() * 10000)}@test.com`;

        // Create User (Operator Admin) WITHOUT School
        const user = await prisma.user.create({
            data: {
                name: 'Operador Sem Escola',
                email: userEmail,
                passwordHash: hash,
                role: UserRole.OPERATOR_ADMIN,
                // schoolId: null (default)
                // canteenId: null (default)
                termsAccepted: true
            }
        });

        const output = `
==========================================
🎉 UNLINKED OPERATOR CREATED
📧 Email: ${userEmail}
🔑 Password: ${passwordRaw}
==========================================
`;
        logger.log(output);
        fs.writeFileSync('operator-creds.txt', output);

    } catch (error) {
        logger.error('❌ Failed to create operator', error);
    } finally {
        await app.close();
    }
}

bootstrap();
