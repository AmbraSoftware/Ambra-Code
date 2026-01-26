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
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
const bcrypt = __importStar(require("bcrypt"));
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL não encontrada no arquivo .env');
}
console.log('DB URL found:', connectionString.replace(/:[^:]*@/, ':****@'));
const pool = new pg_1.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🏗️  Iniciando Sincronização SOBERANIA v4.0 (GENESIS)...');
    const saltRounds = 10;
    const adminPassword = 'Diel@0002323';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
    const masterEmail = 'admin@nodum.io';
    const ambraSystem = await prisma.platformSystem.upsert({
        where: { slug: 'ambra' },
        update: { name: 'AMBRA (Food & Experience)' },
        create: {
            name: 'AMBRA (Food & Experience)',
            slug: 'ambra',
            description: 'Sistema operacional de alta performance para cantinas e nutrição escolar.',
            status: 'ACTIVE',
        },
    });
    const plans = [
        { id: '9657c91e-3558-45b0-9f5b-b9d5690b9687', name: 'Plano Essencial', price: 249.9 },
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Plano Pro', price: 449.9 },
        { id: 'de305d54-75b4-431b-adb2-eb6b9e546014', name: 'Plano Enterprise', price: 0.0 },
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { id: plan.id },
            update: { price: plan.price },
            create: {
                id: plan.id,
                name: plan.name,
                price: plan.price,
                status: client_1.PlanStatus.ACTIVE,
                features: { whiteLabel: true },
            },
        });
    }
    console.log('💰 Semeando Operadores Financeiros...');
    const opElite = await prisma.operator.upsert({
        where: { taxId: '11.111.111/0001-11' },
        update: {},
        create: {
            name: 'Colégio Elite Mantenedora Ltda',
            taxId: '11.111.111/0001-11',
            asaasKey: '$aact_elite_key',
            asaasId: 'wall_elite_001',
        }
    });
    const opSeuJoao = await prisma.operator.upsert({
        where: { taxId: '22.222.222/0001-22' },
        update: {},
        create: {
            name: 'João da Silva Cantina MEI',
            taxId: '22.222.222/0001-22',
            asaasKey: '$aact_joao_key',
            asaasId: 'wall_joao_002',
        }
    });
    const opCatering = await prisma.operator.upsert({
        where: { taxId: '33.333.333/0001-33' },
        update: {},
        create: {
            name: 'Tereza Foods Catering S/A',
            taxId: '33.333.333/0001-33',
            asaasKey: '$aact_catering_key',
            asaasId: 'wall_catering_003'
        }
    });
    const gov = await prisma.government.upsert({
        where: { slug: 'pref-sp-v4' },
        update: {},
        create: {
            name: 'Prefeitura de São Vicente (v4.0)',
            taxId: '46.000.000/0001-00',
            slug: 'pref-sp-v4',
            systemId: ambraSystem.id,
            planId: plans[2].id,
        },
    });
    console.log('🏫 Semeando Escolas (Locais)...');
    const schoolElite = await prisma.school.upsert({
        where: { taxId: '11.111.111/0001-11' },
        update: {},
        create: {
            name: 'Colégio Elite Santos',
            taxId: '11.111.111/0001-11',
            slug: 'colegio-elite',
            systemId: ambraSystem.id,
            planId: plans[2].id,
            status: 'ACTIVE',
            canteens: {
                create: {
                    name: 'Cantina Principal',
                    type: 'COMMERCIAL',
                    operatorId: opElite.id,
                }
            }
        }
    });
    const schoolEtec = await prisma.school.upsert({
        where: { taxId: '55.555.555/0001-55' },
        update: {},
        create: {
            name: 'ETEC Doutora Ruth Cardoso',
            taxId: '55.555.555/0001-55',
            slug: 'etec-ruth',
            systemId: ambraSystem.id,
            planId: plans[1].id,
            governmentId: gov.id,
            status: 'ACTIVE',
            canteens: {
                create: {
                    name: 'Cantina do Tio João',
                    type: 'COMMERCIAL',
                    operatorId: opSeuJoao.id,
                }
            }
        }
    });
    const schoolMuni = await prisma.school.upsert({
        where: { taxId: '66.666.666/0001-66' },
        update: {},
        create: {
            name: 'EMEF Prefeito José Meirelles',
            taxId: '66.666.666/0001-66',
            slug: 'emef-meirelles',
            systemId: ambraSystem.id,
            planId: plans[1].id,
            governmentId: gov.id,
            status: 'ACTIVE',
            canteens: {
                create: [
                    {
                        name: 'Refeitório Merenda (Governo)',
                        type: 'GOVERNMENTAL',
                        operatorId: null,
                    },
                    {
                        name: 'Quiosque de Lanches (Teresa)',
                        type: 'COMMERCIAL',
                        operatorId: opCatering.id,
                    }
                ]
            }
        }
    });
    const admin = await prisma.user.upsert({
        where: { email: masterEmail },
        update: { passwordHash: hashedAdminPassword, role: client_1.UserRole.GLOBAL_ADMIN },
        create: {
            name: 'Gabriel Nodum Master',
            email: masterEmail,
            passwordHash: hashedAdminPassword,
            role: client_1.UserRole.GLOBAL_ADMIN,
        },
    });
    console.log('👷 Semeando Usuários Operacionais...');
    const password123 = await bcrypt.hash('password123', saltRounds);
    const managerElite = await prisma.user.upsert({
        where: { email: 'manager@elite.com' },
        update: { passwordHash: password123, role: client_1.UserRole.SCHOOL_ADMIN, schoolId: schoolElite.id },
        create: {
            name: 'Diretor Elite',
            email: 'manager@elite.com',
            passwordHash: password123,
            role: client_1.UserRole.SCHOOL_ADMIN,
            schoolId: schoolElite.id,
            termsAccepted: true,
            termsVersion: 'v1',
        },
    });
    const operatorElite = await prisma.user.upsert({
        where: { email: 'caixa@elite.com' },
        update: { passwordHash: password123, role: client_1.UserRole.CANTEEN_OPERATOR, schoolId: schoolElite.id },
        create: {
            name: 'Operador Caixa 01',
            email: 'caixa@elite.com',
            passwordHash: password123,
            role: client_1.UserRole.CANTEEN_OPERATOR,
            schoolId: schoolElite.id,
            termsAccepted: true,
            termsVersion: 'v1',
        },
    });
    const studentElite = await prisma.user.upsert({
        where: { email: 'aluno@elite.com' },
        update: { passwordHash: password123, role: client_1.UserRole.STUDENT, schoolId: schoolElite.id },
        create: {
            name: 'Aluno Teste',
            email: 'aluno@elite.com',
            passwordHash: password123,
            role: client_1.UserRole.STUDENT,
            schoolId: schoolElite.id,
            termsAccepted: true,
            termsVersion: 'v1',
        },
    });
    await prisma.wallet.upsert({
        where: { userId: studentElite.id },
        update: { balance: 150.00 },
        create: {
            userId: studentElite.id,
            balance: 150.00,
        }
    });
    console.log('✅ Usuários de Teste Criados:');
    console.log('- Manager: manager@elite.com / 123456');
    console.log('- Operator: caixa@elite.com / 123456');
    console.log('- Student: aluno@elite.com / 123456 (R$ 150,00)');
}
main()
    .catch((e) => {
    console.error('Error Message:', e.message);
    console.error('Error Stack:', e.stack);
    if (e.cause)
        console.error('Error Cause:', e.cause);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map