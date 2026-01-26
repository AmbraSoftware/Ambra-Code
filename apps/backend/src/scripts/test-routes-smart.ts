import axios from 'axios';
import { Logger } from '@nestjs/common';

/**
 * SMART ROUTE VERIFICATION SCRIPT v1.0
 * Executa "Smoke Tests" na API para garantir que rotas críticas
 * respondem corretamente e dentro do SLA (<500ms).
 */

const BASE_URL = 'http://localhost:3000';
const logger = new Logger('SmartRouteTester');

// Configuração de Teste
const TEST_CONFIG = {
    auth: {
        // TODO: Em um cenário real, usaríamos um endpoint de login para pegar o token.
        // Para este script, assumimos que o desenvolvedor fornecerá um TOKEN válido via ENV ou hardcoded para teste local.
        // Se não houver token, testamos apenas rotas públicas.
        token: process.env.TEST_AUTH_TOKEN || '',
    },
    routes: [
        { path: '/health', method: 'GET', expectedStatus: 200, sla: 200, public: true },
        { path: '/products', method: 'GET', expectedStatus: 200, sla: 500, public: false },
        { path: '/metrics/dashboard', method: 'GET', expectedStatus: 200, sla: 1000, public: false }, // Dashboard pode ser mais lento
        // Adicione mais rotas aqui
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
                validateStatus: () => true // Permite capturar qualquer status code sem jogar erro
            };

            const response = await axios.get(`${BASE_URL}${route.path}`, config);
            const duration = Date.now() - startTime;

            if (response.status === route.expectedStatus) {
                if (duration > route.sla) {
                    logger.warn(`🐢 SLOW: ${route.path} - ${duration}ms (SLA: ${route.sla}ms)`);
                    results.slow++;
                } else {
                    logger.log(`✅ PASS: ${route.path} - ${duration}ms`);
                }
                results.passed++;
            } else {
                logger.error(`❌ FAIL: ${route.path} - Status ${response.status} (Esperado: ${route.expectedStatus})`);
                results.failed++;
            }

        } catch (error: any) {
            logger.error(`🔥 ERROR: ${route.path} - ${error.message}`);
            results.failed++;
        }
    }

    logger.log('--- Resumo da Execução ---');
    logger.log(`Total: ${results.total} | ✅ Passou: ${results.passed} | ❌ Falhou: ${results.failed} | 🐢 Lento: ${results.slow}`);

    if (results.failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests();
