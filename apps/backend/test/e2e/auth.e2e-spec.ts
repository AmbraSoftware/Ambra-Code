import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let prisma: PrismaService;

  const adminPassword = 'Diel@0002323';
  const adminEmail = 'admin@cantapp.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    // Configura o Prisma Service para garantir dados
    prisma = app.get<PrismaService>(PrismaService);

    // Seed do usuário Admin para o teste
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Upsert do School/System se necessário (Opcional se FK permitir null ou se seed global já rodou)
    // Para garantir, vamos criar sem schoolId ou com um dummy se a constraint permitir.
    // O Seed original cria User sem School.

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash: hashedPassword },
      create: {
        email: adminEmail,
        name: 'Test Admin',
        passwordHash: hashedPassword,
        role: UserRole.GLOBAL_ADMIN,
      },
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(200); // AuthController retorna 200 (OK) e não 201

      expect(response.body).toHaveProperty('access_token');
      accessToken = response.body.access_token;
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'any',
        })
        .expect(400); // ValidationPipe deve pegar isso
    });
  });

  describe('GET /auth/profile (Protected)', () => {
    it('should return profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe(adminEmail);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });
});
