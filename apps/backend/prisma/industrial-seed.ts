import { PrismaClient, PlanStatus, UserRole } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import * as crypto from 'crypto';

dotenv.config();

const prisma = new PrismaClient();

// ─── Configurações do Asaas ────────────────────────────────────────────────────
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENV = process.env.ASAAS_ENV || 'sandbox';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const ASAAS_BASE_URL =
    ASAAS_ENV === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/api/v3';

if (!ASAAS_API_KEY || !ENCRYPTION_KEY) {
    console.error('❌ ASAAS_API_KEY ou ENCRYPTION_KEY não configuradas no .env');
    process.exit(1);
}

// ─── Helper de Criptografia (réplica do EncryptionService) ────────────────────
function encrypt(text: string): string {
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY!).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AsaasSubAccountData {
    asaasId: string;
    asaasApiKey: string;
    asaasWalletId: string;
}

// ─── Busca subconta existente no Asaas por CPF/CNPJ ──────────────────────────
async function findExistingSubAccount(taxId: string): Promise<AsaasSubAccountData | null> {
    try {
        const cleanTaxId = taxId.replace(/[^\d]/g, '');
        console.log(`🔍 Buscando subconta existente no Asaas para CPF/CNPJ: ${cleanTaxId}...`);
        const response = await axios.get(`${ASAAS_BASE_URL}/accounts`, {
            params: { cpfCnpj: cleanTaxId },
            headers: { access_token: ASAAS_API_KEY },
        });

        const accounts = response.data?.data;
        if (accounts && accounts.length > 0) {
            const account = accounts[0];
            console.log(`✅ Subconta encontrada: ${account.id} (walletId: ${account.walletId})`);
            return {
                asaasId: account.id,
                asaasApiKey: account.apiKey,
                asaasWalletId: account.walletId,
            };
        }
    } catch (error: any) {
        console.warn(`⚠️ Falha ao buscar subcontas: ${JSON.stringify(error.response?.data || error.message)}`);
    }

    return null;
}

// ─── Cria ou recupera subconta no Asaas ───────────────────────────────────────
async function upsertAsaasSubAccount(
    name: string,
    taxId: string,
): Promise<AsaasSubAccountData | null> {
    const cleanTaxId = taxId.replace(/[^\d]/g, '');

    try {
        console.log(`📡 Criando Subconta Asaas para: ${name} (${cleanTaxId})...`);

        const response = await axios.post(
            `${ASAAS_BASE_URL}/accounts`,
            {
                name,
                email: `financeiro_${cleanTaxId}@ambra.invalid`,
                cpfCnpj: cleanTaxId,
                companyType: 'LIMITED',
                address: 'Rua General Genesis',
                addressNumber: '100',
                province: 'Centro',
                postalCode: '11000-000',
                mobilePhone: '11999999999',
            },
            { headers: { access_token: ASAAS_API_KEY } },
        );

        console.log(`✅ Subconta criada: ${response.data.id} (walletId: ${response.data.walletId})`);
        return {
            asaasId: response.data.id,
            asaasApiKey: response.data.apiKey,
            asaasWalletId: response.data.walletId,
        };
    } catch (error: any) {
        const errorCode = error.response?.data?.errors?.[0]?.code;

        // Subconta já existe — tenta recuperar pelo CPF/CNPJ
        if (errorCode === 'account_already_exists' || error.response?.status === 400) {
            console.warn(`⚠️ Subconta já existe no Asaas. Tentando recuperar dados...`);
            return findExistingSubAccount(cleanTaxId);
        }

        console.error(`❌ Erro ao criar subconta: ${JSON.stringify(error.response?.data || error.message)}`);
        return null;
    }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🏗️  Iniciando SEEDER INDUSTRIAL v4.5 (Sincronização Gateway)...\n');

    const saltRounds = 10;
    const password123 = await bcrypt.hash('password123', saltRounds);
    const adminPassword = await bcrypt.hash('Diel@0002323', saltRounds);

    // 1. PLATAFORMA
    const ambraSystem = await prisma.platformSystem.upsert({
        where: { slug: 'ambra' },
        update: {},
        create: {
            name: 'AMBRA (Food & Experience)',
            slug: 'ambra',
            description: 'Sistema operacional de alta performance para cantinas e nutrição escolar.',
        },
    });
    console.log(`✔ PlatformSystem: ${ambraSystem.name}`);

    // 2. PLANO
    const basicPlan = await prisma.plan.upsert({
        where: { id: '9657c91e-3558-45b0-9f5b-b9d5690b9687' },
        update: {},
        create: {
            id: '9657c91e-3558-45b0-9f5b-b9d5690b9687',
            name: 'Plano Essencial Industrial',
            price: 150.0,
            target: 'SCHOOL_SAAS',
            feesConfig: {
                rechargeFixed: 3.0,
                rechargePercent: 5.0,
                transactionPercent: 4.0,
                convenienceFee: 2.99,
            },
        },
    });
    console.log(`✔ Plan: ${basicPlan.name}`);

    // 3. OPERADOR — CNPJ: 21.725.700/0001-81 (Ambra Software)
    //    FIX: taxId do Operator e da School são DIFERENTES para evitar conflito @unique
    const opData = await upsertAsaasSubAccount('Operador Elite Industrial', '21.725.700/0001-81');

    if (!opData) {
        console.error('\n🛑 Falha crítica: Não foi possível sincronizar com o Asaas Sandbox.');
        console.error('   Verifique se ASAAS_API_KEY está correta e ativa no .env\n');
        process.exit(1);
    }

    const encryptedKey = encrypt(opData.asaasApiKey);

    const opElite = await prisma.operator.upsert({
        where: { taxId: '21.725.700/0001-81' },
        update: {
            asaasId: opData.asaasId,
            asaasWalletId: opData.asaasWalletId,
            // FIX: preenche AMBOS os campos de token para garantir compatibilidade
            asaasApiKey: encryptedKey,
            asaasToken: encryptedKey,
        },
        create: {
            name: 'Operador Elite Industrial',
            taxId: '21.725.700/0001-81',
            asaasId: opData.asaasId,
            asaasWalletId: opData.asaasWalletId,
            // FIX: preenche AMBOS os campos de token
            asaasApiKey: encryptedKey,
            asaasToken: encryptedKey,
            address: 'Rua General Genesis',
            addressNumber: '100',
            postalCode: '11000-000',
        },
    });
    console.log(`✔ Operator: ${opElite.name} → asaasId: ${opElite.asaasId} | walletId: ${opElite.asaasWalletId}`);

    // 4. ESCOLA — FIX: CNPJ próprio para evitar conflito @unique com o Operator
    //    Usando CNPJ fictício de teste (estrutura válida, não cadastrado na Receita)
    const schoolElite = await prisma.school.upsert({
        where: { slug: 'colegio-elite' },
        update: {},
        create: {
            name: 'Colégio Elite Industrial',
            taxId: '11.222.333/0001-81', // ← CNPJ distinto do Operator
            slug: 'colegio-elite',
            systemId: ambraSystem.id,
            planId: basicPlan.id,
            status: 'ACTIVE',
        },
    });
    console.log(`✔ School: ${schoolElite.name}`);

    // 5. CANTINA
    const canteen = await prisma.canteen.upsert({
        where: { id: '77777777-7777-7777-7777-777777777777' },
        update: { operatorId: opElite.id },
        create: {
            id: '77777777-7777-7777-7777-777777777777',
            name: 'Cantina Principal Elite',
            schoolId: schoolElite.id,
            operatorId: opElite.id,
        },
    });
    console.log(`✔ Canteen: ${canteen.name}`);

    // 6. USUÁRIOS

    // Admin SUPER
    const admin = await prisma.user.upsert({
        where: { email: 'admin@nodum.io' },
        update: { passwordHash: adminPassword },
        create: {
            name: 'Admin Industrial',
            email: 'admin@nodum.io',
            passwordHash: adminPassword,
            role: UserRole.SUPER_ADMIN,
            roles: [UserRole.SUPER_ADMIN],
        },
    });
    console.log(`✔ User (SUPER_ADMIN): ${admin.email}`);

    // Aluno de teste
    const student = await prisma.user.upsert({
        where: { email: 'aluno@elite.com' },
        update: { passwordHash: password123 },
        create: {
            name: 'Aluno Industrial',
            email: 'aluno@elite.com',
            passwordHash: password123,
            role: UserRole.STUDENT,
            roles: [UserRole.STUDENT],
            schoolId: schoolElite.id,
            document: '21725700018',
            birthDate: new Date('2000-01-01'),
            termsAccepted: true,
            termsVersion: 'v1',
        },
    });
    console.log(`✔ User (STUDENT): ${student.email}`);

    // 7. WALLET
    await prisma.wallet.upsert({
        where: { userId: student.id },
        update: { balance: 500.0 },
        create: {
            userId: student.id,
            balance: 500.0,
        },
    });
    console.log(`✔ Wallet: R$ 500,00 → ${student.email}`);

    // ─── Resumo Final ──────────────────────────────────────────────────────────
    console.log('\n════════════════════════════════════════════════════════');
    console.log('🚀  SEED INDUSTRIAL v4.5 CONCLUÍDO COM SUCESSO!');
    console.log('════════════════════════════════════════════════════════');
    console.log(`  Sistema    : ${ambraSystem.name}`);
    console.log(`  Operador   : ${opElite.name}`);
    console.log(`  Asaas ID   : ${opElite.asaasId}`);
    console.log(`  Wallet ID  : ${opElite.asaasWalletId}`);
    console.log(`  Escola     : ${schoolElite.name} (CNPJ: ${schoolElite.taxId})`);
    console.log(`  Aluno      : ${student.email} | Saldo: R$ 500,00`);
    console.log(`  Admin      : ${admin.email}`);
    console.log('════════════════════════════════════════════════════════');
    console.log('\n✅  Próximo passo: teste a geração do QR Code PIX com o aluno acima.');
}

main()
    .catch((e) => {
        console.error('❌ Erro no Seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });