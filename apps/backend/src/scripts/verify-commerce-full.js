"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const orders_service_1 = require("../src/modules/orders/orders.service");
const stock_service_1 = require("../src/modules/stock/stock.service");
const prisma_service_1 = require("../src/prisma/prisma.service");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('CommerceVerification');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const ordersService = app.get(orders_service_1.OrdersService);
    const stockService = app.get(stock_service_1.StockService);
    const prisma = app.get(prisma_service_1.PrismaService);
    logger.log('🚀 Starting Commerce Stress Test...');
    try {
        const school = await prisma.school.findFirst();
        const student = await prisma.user.findFirst({ where: { role: 'STUDENT', schoolId: school?.id } });
        const canteen = await prisma.canteen.findFirst({ where: { schoolId: school?.id } });
        if (!student || !canteen)
            throw new Error('Seed data missing');
        const product = await prisma.product.create({
            data: {
                name: 'Stress Test Bar',
                price: 5.00,
                stock: 1,
                category: 'SNACK',
                canteenId: canteen.id,
                schoolId: school.id,
                isAvailable: true
            }
        });
        logger.log(`1. Created Product "${product.name}" with Stock: ${product.stock}`);
        logger.log('2. Running Parallel Purchase Attack (5 concurrent requests for 1 item)...');
        await prisma.wallet.update({
            where: { userId: student.id },
            data: { balance: 1000 }
        });
        const tasks = Array.from({ length: 5 }).map(async (_, index) => {
            try {
                await ordersService.create(student.id, {
                    studentId: student.id,
                    items: [{ productId: product.id, quantity: 1 }]
                });
                return { status: 'SUCCESS', index };
            }
            catch (e) {
                return { status: 'FAILED', index, reason: e.message };
            }
        });
        const results = await Promise.all(tasks);
        const successes = results.filter(r => r.status === 'SUCCESS');
        const failures = results.filter(r => r.status === 'FAILED');
        logger.log('--- Race Condition Results ---');
        logger.log(`Attempts: ${results.length}`);
        logger.log(`Successes: ${successes.length} (Should be EXACTLY 1)`);
        logger.log(`Failures: ${failures.length}`);
        if (successes.length === 1 && failures.length === 4) {
            logger.log('✅ PASS: Atomic Transaction Isolation Held perfectly.');
        }
        else {
            logger.error('❌ FAIL: Race condition detected or Logic error.');
        }
        const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
        logger.log(`Final Real Stock: ${finalProduct?.stock} (Should be 0)`);
    }
    catch (error) {
        logger.error('Verification Failed', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=verify-commerce-full.js.map