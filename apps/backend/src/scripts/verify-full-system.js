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
const prisma_service_1 = require("../src/prisma/prisma.service");
const asaas_service_1 = require("../src/modules/asaas/asaas.service");
const asaas_webhook_service_1 = require("../src/modules/asaas/asaas.webhook.service");
const transactions_service_1 = require("../src/modules/transactions/transactions.service");
const stock_service_1 = require("../src/modules/stock/stock.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const prisma = app.get(prisma_service_1.PrismaService);
    const asaasService = app.get(asaas_service_1.AsaasService);
    const webhookService = app.get(asaas_webhook_service_1.AsaasWebhookService);
    const transactionService = app.get(transactions_service_1.TransactionService);
    const stockService = app.get(stock_service_1.StockService);
    const logger = new common_1.Logger('SystemVerification');
    logger.log('🚀 Starting Full System Verification Check (REAL API MODE)...');
    const generateCPF = (masked = false) => {
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
    const generateCNPJ = () => {
        const rnd = (n) => Math.round(Math.random() * n);
        const mod = (base, div) => Math.round(base - Math.floor(base / div) * div);
        const n = 9;
        const n1 = rnd(n), n2 = rnd(n), n3 = rnd(n), n4 = rnd(n), n5 = rnd(n), n6 = rnd(n), n7 = rnd(n), n8 = rnd(n);
        let d1 = n1 * 2 + n2 * 3 + n3 * 4 + n4 * 5 + n5 * 6 + n6 * 7 + n7 * 8 + n8 * 9;
        d1 = 11 - mod(d1, 11);
        if (d1 >= 10)
            d1 = 0;
        let d2 = d1 * 2 + n1 * 3 + n2 * 4 + n3 * 5 + n4 * 6 + n5 * 7 + n6 * 8 + n7 * 9 + n8 * 10;
        d2 = 11 - mod(d2, 11);
        if (d2 >= 10)
            d2 = 0;
        return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}0001${d1}${d2}`;
    };
    const NAMES_POOL = ['Alpha', 'Beta', 'Gamma'];
    try {
        const testSuffix = Math.floor(Math.random() * 1000);
        const systemSlug = `sys-verify-${testSuffix}`;
        const schoolSlug = `school-verify-${testSuffix}`;
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
        logger.log('🔄 [LOOP] Creating 3 Operators (Canteen Owners) with Asaas Subaccounts...');
        const operators = [];
        const canteens = [];
        for (let i = 0; i < 3; i++) {
            const name = `${NAMES_POOL[i]} Cantina`;
            const taxId = generateCPF();
            logger.log(`👉 [Operator ${i + 1}/3] Provisioning '${name}' (${taxId}) as INDIVIDUAL...`);
            let asaasId = `mock_fail_${i}_${testSuffix}_${Math.random().toString(36).substring(7)}`;
            let walletId = `mock_wallet_${i}_${testSuffix}`;
            try {
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
            }
            catch (e) {
                logger.error(`   ❌ Asaas Failed for ${name}: ${JSON.stringify(e.response?.data || e.message)}`);
            }
            const op = await prisma.operator.create({
                data: {
                    name: `${name} ${testSuffix}`,
                    taxId: taxId,
                    asaasId: asaasId,
                    asaasWalletId: walletId
                }
            });
            operators.push(op);
            const canteen = await prisma.canteen.create({
                data: {
                    name: `${name} Unit`,
                    schoolId: school.id,
                    type: client_1.CanteenType.COMMERCIAL,
                    operatorId: op.id
                }
            });
            canteens.push(canteen);
            await prisma.user.create({
                data: {
                    name: `Dono ${name}`,
                    email: `owner_${i}_${testSuffix}@nodum.com`,
                    passwordHash: 'hash',
                    role: client_1.UserRole.OPERATOR_ADMIN,
                    schoolId: school.id
                }
            });
        }
        logger.log('🔄 [LOOP] Creating 3 Families (Guardian + Student) & Testing Finance Flow...');
        for (let i = 0; i < 3; i++) {
            const familyName = NAMES_POOL[i];
            const cpf = generateCPF();
            const targetCanteen = canteens[i];
            if (!operators[i]) {
                logger.warn(`Skipping Family ${i + 1} due to missing Operator.`);
                continue;
            }
            logger.log(`👉 [Family ${i + 1}/3] ${familyName} Family Setup (${cpf})...`);
            const guardian = await prisma.user.create({
                data: {
                    name: `Guardian ${familyName}`,
                    email: `guardian_${i}_${testSuffix}@nodum.com`,
                    passwordHash: 'hash',
                    role: client_1.UserRole.GUARDIAN,
                    schoolId: school.id,
                    document: cpf
                }
            });
            const wallet = await prisma.wallet.create({
                data: { userId: guardian.id, dailySpendLimit: 100.00 }
            });
            logger.log(`   💳 Testing Recharge R$ 50.00 (Split: 5.00 Nodum / 45.00 ${operators[i].name})...`);
            const charge = await transactionService.prepareRecharge(guardian.id, 50.00);
            logger.log(`      Pix Created: ${charge.transactionId}`);
            const webhookPayload = {
                id: `evt_auto_${i}_${testSuffix}`,
                event: 'PAYMENT_RECEIVED',
                payment: {
                    id: charge.transactionId,
                    customer: guardian.document,
                    externalReference: guardian.id,
                    value: 50.00,
                    netValue: 45.00,
                    split: [
                        { walletId: operators[i].asaasWalletId, fixedValue: 45.00 },
                        { walletId: process.env.ASAAS_MASTER_WALLET_ID, fixedValue: 5.00 }
                    ]
                }
            };
            await webhookService.handleWebhook(webhookPayload);
            const wCheck = await prisma.wallet.findUnique({ where: { id: wallet.id } });
            if (!wCheck)
                throw new Error(`Wallet ${wallet.id} not found check.`);
            if (Number(wCheck.balance) === 50.00)
                logger.log('      ✅ Wallet Credited');
            else
                logger.error(`      ❌ Wallet Balance Incorrect: ${wCheck.balance}`);
            const tx = await prisma.transaction.findFirst({ where: { walletId: wallet.id, type: 'RECHARGE' } });
            if (!tx)
                throw new Error('Transaction RECHARGE not found');
            if (Number(tx.netAmount) === 45.00)
                logger.log('      ✅ Transaction Ledger Split Correct');
            else
                logger.error(`      ❌ Ledger Incorrect: ${tx.netAmount}`);
            logger.log(`   🛒 Testing Purchase (Item R$ 10.00)...`);
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
            await transactionService.processPurchase(guardian.id, guardian.id, 10.00);
            await prisma.$transaction(async (tx) => {
                await stockService.confirmSaleInTransaction(tx, `order_${i}`, [{ productId: prod.id, quantity: 1 }], targetCanteen.id);
            });
            const pCheck = await prisma.product.findUnique({ where: { id: prod.id } });
            if (!pCheck)
                throw new Error('Product check failed');
            if (pCheck.stock === 4)
                logger.log('      ✅ Stock Decremented (5->4)');
            else
                logger.error(`      ❌ Stock Fail: ${pCheck.stock}`);
        }
        logger.log('🏁 Verification Complete.');
    }
    catch (error) {
        logger.error('CRITICAL FAILURE', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=verify-full-system.js.map