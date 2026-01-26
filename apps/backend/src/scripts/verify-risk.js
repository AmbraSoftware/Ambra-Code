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
const risk_service_1 = require("../src/modules/risk/risk.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const riskService = app.get(risk_service_1.RiskService);
    const prisma = app.get(prisma_service_1.PrismaService);
    const logger = new common_1.Logger('RiskVerification');
    logger.log('🚀 Starting Risk Module Verification...');
    try {
        const testSuffix = Math.floor(Math.random() * 10000);
        const goodUser = await prisma.user.create({
            data: {
                name: `Good Payer ${testSuffix}`,
                email: `good_${testSuffix}@risk.test`,
                passwordHash: 'pass',
                role: 'GUARDIAN',
                createdAt: new Date(new Date().getTime() - 100 * 24 * 3600 * 1000),
                wallet: {
                    create: {
                        balance: 500,
                        dailySpendLimit: 100,
                        allowedDays: [1]
                    }
                }
            },
            include: { wallet: true }
        });
        if (!goodUser.wallet)
            throw new Error('Wallet not created');
        await prisma.transaction.createMany({
            data: Array(15).fill(null).map((_, i) => ({
                userId: goodUser.id,
                walletId: goodUser.wallet.id,
                amount: 10,
                netAmount: 10,
                runningBalance: 500,
                type: client_1.TransactionType.PURCHASE,
                status: client_1.TransactionStatus.COMPLETED,
                description: `Tx ${i}`
            }))
        });
        logger.log(`Analyzing Good User: ${goodUser.email}`);
        const goodAnalysis = await riskService.calculateInternalScore(goodUser.id);
        logger.log(`>> Score: ${goodAnalysis.score}`);
        logger.log(`>> Level: ${goodAnalysis.riskLevel}`);
        logger.log(`>> Details: ${JSON.stringify(goodAnalysis.details)}`);
        if (goodAnalysis.score >= 650) {
            logger.log('✅ Internal Score Logic Verified (Good User)');
        }
        else {
            logger.error('❌ Internal Score Logic Mismatch');
        }
        logger.log('Testing External Serasa Mock...');
        const cpfGood = '12345678909';
        const cpfBad = '12345678901';
        const extGood = await riskService.consultExternalSerasa(cpfGood);
        logger.log(`External Good (${cpfGood}): ${extGood.score} [${extGood.riskLevel}]`);
        const extBad = await riskService.consultExternalSerasa(cpfBad);
        logger.log(`External Bad (${cpfBad}): ${extBad.score} [${extBad.riskLevel}]`);
        if (extGood.score === 900 && extBad.score === 300) {
            logger.log('✅ External Mock Logic Verified');
        }
        else {
            logger.error('❌ External Mock Logic Mismatch');
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
//# sourceMappingURL=verify-risk.js.map