"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const BASE_URL = 'http://localhost:3000';
const logger = new common_1.Logger('SmartRouteTester');
const TEST_CONFIG = {
    auth: {
        token: process.env.TEST_AUTH_TOKEN || '',
    },
    routes: [
        { path: '/health', method: 'GET', expectedStatus: 200, sla: 200, public: true },
        { path: '/products', method: 'GET', expectedStatus: 200, sla: 500, public: false },
        { path: '/metrics/dashboard', method: 'GET', expectedStatus: 200, sla: 1000, public: false },
    ]
};
async function runTests() {
    logger.log('🕵️ Iniciando Smart Route Verification...');
    if (!TEST_CONFIG.auth.token) {
        logger.warn('⚠️ Nenhum token de autenticação fornecido (TEST_AUTH_TOKEN). Testando apenas rotas públicas.');
    }
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        slow: 0
    };
    for (const route of TEST_CONFIG.routes) {
        if (!route.public && !TEST_CONFIG.auth.token) {
            logger.debug(`⏭️ Pulando rota protegida: ${route.path}`);
            continue;
        }
        results.total++;
        const startTime = Date.now();
        try {
            const config = {
                headers: route.public ? {} : { Authorization: `Bearer ${TEST_CONFIG.auth.token}` },
                validateStatus: () => true
            };
            const response = await axios_1.default.get(`${BASE_URL}${route.path}`, config);
            const duration = Date.now() - startTime;
            if (response.status === route.expectedStatus) {
                if (duration > route.sla) {
                    logger.warn(`🐢 SLOW: ${route.path} - ${duration}ms (SLA: ${route.sla}ms)`);
                    results.slow++;
                }
                else {
                    logger.log(`✅ PASS: ${route.path} - ${duration}ms`);
                }
                results.passed++;
            }
            else {
                logger.error(`❌ FAIL: ${route.path} - Status ${response.status} (Esperado: ${route.expectedStatus})`);
                results.failed++;
            }
        }
        catch (error) {
            logger.error(`🔥 ERROR: ${route.path} - ${error.message}`);
            results.failed++;
        }
    }
    logger.log('--- Resumo da Execução ---');
    logger.log(`Total: ${results.total} | ✅ Passou: ${results.passed} | ❌ Falhou: ${results.failed} | 🐢 Lento: ${results.slow}`);
    if (results.failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runTests();
//# sourceMappingURL=test-routes-smart.js.map