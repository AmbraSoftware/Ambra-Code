import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';  // ✅ Default import
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

describe('Ambra Backend E2E Tests (Critical Flows)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let prisma: PrismaService;

  // ✅ FIX: Header necessário para TenantMiddleware identificar a escola
  const TENANT_SLUG = 'colegio-elite';

  const api = {
    get: (path: string, opts?: { auth?: boolean; ip?: string }) => {
      const req = request(app.getHttpServer())
        .get(path)
        .set('x-tenant-slug', TENANT_SLUG);

      if (opts?.ip) {
        req.set('x-forwarded-for', opts.ip);
      }

      if (opts?.auth && authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }

      return req;
    },
    post: (path: string, opts?: { auth?: boolean; ip?: string }) => {
      const req = request(app.getHttpServer())
        .post(path)
        .set('x-tenant-slug', TENANT_SLUG);

      if (opts?.ip) {
        req.set('x-forwarded-for', opts.ip);
      }

      if (opts?.auth && authToken) {
        req.set('Authorization', `Bearer ${authToken}`);
      }

      return req;
    },
  };

  // ============================================
  // SETUP & TEARDOWN
  // ============================================

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = moduleFixture.get(PrismaService);

    app = moduleFixture.createNestApplication();

    // Necessário para que req.ip considere x-forwarded-for em testes
    app.getHttpAdapter().getInstance().set('trust proxy', true);

    // Aplicar pipes globais (mesma config do main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // -----------------------------------------------------------------
    // Deterministic seed for E2E
    // -----------------------------------------------------------------
    // These tests must not rely on external seed execution.
    // We create the minimum tenant graph required by AuthService + guards:
    // PlatformSystem -> Plan -> School(status ACTIVE, slug TENANT_SLUG) -> User(STUDENT) -> Wallet

    const system = await prisma.platformSystem.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Test System',
        slug: 'test-system',
        description: 'E2E System',
      },
    });

    const plan = await prisma.plan.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Plan',
        description: 'E2E Plan',
        price: 0,
        status: 'ACTIVE',
      },
    });

    const school = await prisma.school.upsert({
      where: { slug: TENANT_SLUG },
      update: {
        status: 'ACTIVE',
        active: true,
        systemId: system.id,
        planId: plan.id,
      },
      create: {
        name: 'Colégio Elite (E2E)',
        taxId: `E2E-${Date.now()}`,
        slug: TENANT_SLUG,
        status: 'ACTIVE',
        active: true,
        systemId: system.id,
        planId: plan.id,
      },
      select: { id: true },
    });

    const operator = await prisma.operator.upsert({
      where: { taxId: '00000000000000' },
      update: {
        asaasId: 'acc_test_operator',
        asaasWalletId: 'wal_test_operator',
      },
      create: {
        name: 'Operador E2E',
        taxId: '00000000000000',
        asaasId: 'acc_test_operator',
        asaasWalletId: 'wal_test_operator',
      },
      select: { id: true },
    });

    // Guarantee the active commercial canteen has an operatorId set.
    // If a previous seed left operatorId null, prepareRechargeFromPending will fail.
    await prisma.canteen.updateMany({
      where: {
        schoolId: school.id,
        type: 'COMMERCIAL',
        status: 'ACTIVE',
      },
      data: { operatorId: operator.id },
    });

    const existingCanteen = await prisma.canteen.findFirst({
      where: { schoolId: school.id, type: 'COMMERCIAL', status: 'ACTIVE' },
      select: { id: true },
    });

    if (!existingCanteen) {
      await prisma.canteen.create({
        data: {
          name: 'Cantina E2E',
          type: 'COMMERCIAL',
          schoolId: school.id,
          operatorId: operator.id,
          status: 'ACTIVE',
        },
      });
    }

    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'aluno@elite.com' },
      update: {
        passwordHash: hashedPassword,
        role: UserRole.STUDENT,
        roles: [UserRole.STUDENT],
        schoolId: school.id,
        birthDate: new Date('2000-01-01'),
        deletedAt: null,
      },
      create: {
        name: 'Aluno E2E',
        email: 'aluno@elite.com',
        passwordHash: hashedPassword,
        role: UserRole.STUDENT,
        roles: [UserRole.STUDENT],
        schoolId: school.id,
        birthDate: new Date('2000-01-01'),
        termsAccepted: true,
        termsVersion: 'e2e',
      },
      select: { id: true },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: 0,
        creditLimit: 0,
        dailySpendLimit: 50,
        canPurchaseAlone: true,
        canRechargeAlone: true,
        allowedDays: [1, 2, 3, 4, 5, 6, 0],
      },
    });

    // Garantir token para os testes que dependem de autenticação.
    // Não depende de ordem de execução dos `it()`.
    const loginResponse = await api
      .post('/auth/login')
      .send({
        email: 'aluno@elite.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;

    // Garantir pré-condições do DB para os asserts do E2E.
    // (O seed pode não ter sido executado antes do test runner.)
    await prisma.wallet.updateMany({
      where: { userId },
      data: {
        dailySpendLimit: 50,
      },
    });
  }, 30000); // 30 segundos de timeout para inicialização

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ============================================
  // 1. AUTH FLOW (/auth/login)
  // ============================================

  describe('Auth Flow', () => {
    describe('POST /auth/login', () => {
      it('✅ Caso Sucesso: Login com credenciais válidas (retorna Token JWT)', async () => {
        const response = await api
          .post('/auth/login')
          .send({
            email: 'aluno@elite.com',
            password: 'password123',
          })
          .expect(200);

        // Validar estrutura da resposta
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('id');
        expect(response.body.user).toHaveProperty('email', 'aluno@elite.com');
        expect(response.body.user).toHaveProperty('role');

        // Salvar token para testes subsequentes
        authToken = response.body.access_token;
        userId = response.body.user.id;

        // Validar formato do JWT (3 partes separadas por ponto)
        expect(authToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
      });

      it('❌ Caso Erro: Login com senha errada (401 Unauthorized)', async () => {
        const response = await api
          .post('/auth/login')
          .send({
            email: 'aluno@elite.com',
            password: 'senhaErrada123',
          })
          .expect(401);

        // Validar mensagem de erro
        expect(response.body).toHaveProperty('message');
        expect(response.body.statusCode).toBe(401);
      });

      it('❌ Caso Erro: Login com email inexistente (401 Unauthorized)', async () => {
        await api
          .post('/auth/login')
          .send({
            email: 'naoexiste@teste.com',
            password: 'password123',
          })
          .expect(401);
      });

      it('❌ Caso Erro: Login sem email (400 Bad Request)', async () => {
        await api
          .post('/auth/login')
          .send({
            password: 'password123',
          })
          .expect(400);
      });

      it('❌ Caso Erro: Login sem senha (400 Bad Request)', async () => {
        await api
          .post('/auth/login')
          .send({
            email: 'aluno@elite.com',
          })
          .expect(400);
      });
    });
  });

  // ============================================
  // 2. WALLET FLOW (/wallet e /wallet/transactions)
  // ============================================

  describe('Wallet Flow', () => {
    describe('GET /wallet', () => {
      it('✅ Caso Sucesso: Retorna objeto Wallet com campos alinhados (creditLimit, allowedDays, status)', async () => {
        const response = await api
          .get('/wallet/me', { auth: true })  // ✅ Rota correta
          .expect(200);

        // Validar estrutura EXATA do Wallet (alinhado com Frontend)
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('balance');
        expect(response.body).toHaveProperty('dailyLimit');
        expect(response.body).toHaveProperty('creditLimit'); // ✅ Alinhado com Frontend
        expect(response.body).toHaveProperty('allowedDays'); // ✅ Alinhado com Frontend
        expect(response.body).toHaveProperty('status'); // ✅ Alinhado com Frontend

        // Validar tipos
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.balance).toBe('number');
        expect(typeof response.body.dailyLimit).toBe('number');
        expect(typeof response.body.creditLimit).toBe('number');
        expect(Array.isArray(response.body.allowedDays)).toBe(true);
        expect(['ACTIVE', 'BLOCKED', 'PENDING']).toContain(response.body.status);

        // Validar valores lógicos
        expect(response.body.balance).toBeGreaterThanOrEqual(0);
        expect(response.body.dailyLimit).toBeGreaterThan(0);
        expect(response.body.creditLimit).toBeGreaterThanOrEqual(0);
      });

      it('❌ Caso Erro: GET /wallet sem token (401 Unauthorized)', async () => {
        await api
          .get('/wallet/me')  // ✅ Rota correta
          .expect(401);
      });

      it('❌ Caso Erro: GET /wallet com token inválido (401 Unauthorized)', async () => {
        await api
          .get('/wallet/me')  // ✅ Rota correta
          .set('Authorization', 'Bearer token_invalido_123')
          .expect(401);
      });
    });

    describe('GET /wallet/transactions', () => {
      it('✅ Caso Sucesso: Retorna lista de transações com tipos alinhados (CASH_IN, PURCHASE, REFUND, ADJUSTMENT)', async () => {
        const response = await api
          .get('/wallet/transactions', { auth: true })
          .query({ limit: 10 })
          .expect(200);

        // Validar que é um array
        expect(Array.isArray(response.body)).toBe(true);

        // Se houver transações, validar estrutura
        if (response.body.length > 0) {
          const transaction = response.body[0];

          expect(transaction).toHaveProperty('id');
          expect(transaction).toHaveProperty('type');
          expect(transaction).toHaveProperty('amount');
          expect(transaction).toHaveProperty('description');
          expect(transaction).toHaveProperty('createdAt');
          expect(transaction).toHaveProperty('status');

          // Validar tipos permitidos (alinhado com Frontend)
          expect(['CASH_IN', 'PURCHASE', 'REFUND', 'ADJUSTMENT']).toContain(transaction.type);
          expect(['PENDING', 'COMPLETED', 'FAILED']).toContain(transaction.status);

          // Validar tipos de dados
          expect(typeof transaction.id).toBe('string');
          expect(typeof transaction.amount).toBe('number');
          expect(typeof transaction.description).toBe('string');
          expect(typeof transaction.createdAt).toBe('string');
        }
      });

      it('✅ Caso Sucesso: Limit query param funciona corretamente', async () => {
        const response = await api
          .get('/wallet/transactions', { auth: true })
          .query({ limit: 5 })
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeLessThanOrEqual(5);
      });

      it('❌ Caso Erro: GET /wallet/transactions sem token (401 Unauthorized)', async () => {
        await api
          .get('/wallet/transactions')
          .expect(401);
      });
    });
  });

  // ============================================
  // 3. PAYMENT FLOW (/payment/pix-recharge)
  // ============================================

  describe('Payment Flow', () => {
    describe('POST /payment/pix-recharge', () => {
      it('✅ Caso Sucesso: Recarga com valor válido retorna payload PIX (Copia e Cola)', async () => {
        const response = await api
          .post('/payment/recharge-request', { auth: true, ip: '10.0.0.1' })  // ✅ Rota correta
          .send({
            amount: 50.00,
            dependentId: userId,  // ✅ Campo obrigatório
          })
          .expect(200);  // ✅ Status correto (não 201)

        // Validar estrutura do payload PIX
        expect(response.body).toHaveProperty('transactionId');
        expect(response.body).toHaveProperty('pixCode'); // ✅ Copia e Cola
        expect(response.body).toHaveProperty('qrCode'); // ✅ Base64 ou URL
        expect(response.body).toHaveProperty('expiresAt');
        expect(response.body).toHaveProperty('totalAmount');
        expect(response.body).toHaveProperty('fees');

        // Validar tipos
        expect(typeof response.body.transactionId).toBe('string');
        expect(typeof response.body.pixCode).toBe('string');
        expect(typeof response.body.qrCode).toBe('string');
        expect(typeof response.body.expiresAt).toBe('string');
        expect(typeof response.body.totalAmount).toBe('number');
        expect(typeof response.body.fees).toBe('number');

        // Validar valores lógicos
        expect(response.body.totalAmount).toBeGreaterThan(0);
        expect(response.body.fees).toBeGreaterThanOrEqual(0);
        expect(response.body.pixCode.length).toBeGreaterThan(10); // PIX Copia e Cola é longo
      }, 15000);

      it('❌ Caso Erro: Recarga com valor zero (400 Bad Request)', async () => {
        const response = await api
          .post('/payment/recharge-request', { auth: true, ip: '10.0.0.2' })  // ✅ Rota correta
          .send({
            amount: 0,
            dependentId: userId,
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.statusCode).toBe(400);
      });

      it('❌ Caso Erro: Recarga com valor negativo (400 Bad Request)', async () => {
        const response = await api
          .post('/payment/recharge-request', { auth: true, ip: '10.0.0.3' })  // ✅ Rota correta
          .send({
            amount: -10.00,
            dependentId: userId,
          })
          .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.statusCode).toBe(400);
      });

      it('❌ Caso Erro: Recarga sem token (401 Unauthorized)', async () => {
        await api
          .post('/payment/recharge-request', { ip: '10.0.0.4' })  // ✅ Rota correta
          .send({
            amount: 50.00,
            dependentId: userId,
          })
          .expect(401);
      });

      it('❌ Caso Erro: Recarga sem amount (400 Bad Request)', async () => {
        await api
          .post('/payment/recharge-request', { auth: true, ip: '10.0.0.5' })  // ✅ Rota correta
          .send({
            dependentId: userId,
          })
          .expect(400);
      });

      it('❌ Caso Erro: Recarga sem dependentId (400 Bad Request)', async () => {
        await api
          .post('/payment/recharge-request', { auth: true, ip: '10.0.0.6' })  // ✅ Rota correta
          .send({
            amount: 50.00,
          })
          .expect(400);
      });
    });
  });

  // ============================================
  // 4. HEALTH CHECK (Bonus)
  // ============================================

  describe('Health Check', () => {
    it('✅ GET /health retorna status OK', async () => {
      const response = await api
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });
  });
});
