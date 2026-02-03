import 'dotenv/config'; // DEVE SER A PRIMEIRA LINHA
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import helmet from 'helmet';

import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Habilita o rawBody para que possamos validar assinaturas de webhooks.
    rawBody: true,
  });
  const logger = new Logger('Bootstrap');

  // Adiciona o Helmet para configurar cabeçalhos de segurança HTTP.
  // Esta é uma primeira linha de defesa crucial contra vários ataques comuns.
  app.use(helmet());

  // Habilita compressão Gzip globalmente
  // Reduz significativamente o tamanho do payload JSON (Speed Boost)
  app.use(compression());

  // Configuração de CORS rigorosa para produção.
  app.enableCors({
    origin: [
      'http://localhost:3000', // Frontend Local 1
      'http://localhost:3001', // Frontend Local 2
      'http://localhost:3002', // Ambra Food Web (PWA)
      'http://localhost:3008', // Ambra Flow Local
      'https://nodum-platform-nodum-console.vercel.app', // Vercel Console
      'https://trilingually-unmurmurous-maurita.ngrok-free.dev', // Tunnel Ngrok
      'https://app.seunome.com', // Produção Cliente
      'https://admin.seunome.com', // Produção Admin
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Aplica validação global para todos os DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades que não estão no DTO
      transform: true, // Transforma o payload para a instância do DTO
      forbidNonWhitelisted: true, // Lança erro se propriedades extras forem enviadas
    }),
  );

  // Aplica filtros de exceção globais
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Nodum Kernel API')
    .setDescription(
      'Documentação da API para o Ecossistema Nodum (Control Plane & Ambra Vertical)',
    )
    .setVersion('3.8.25-bank-grade')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3333;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI is available at: http://localhost:${port}/api/docs`);
}

bootstrap();
