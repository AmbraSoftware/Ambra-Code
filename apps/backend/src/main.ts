import 'dotenv/config'; // DEVE SER A PRIMEIRA LINHA
import * as Sentry from '@sentry/nestjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { SentryInterceptor } from './common/interceptors/sentry.interceptor';
import helmet from 'helmet';

import compression from 'compression';

// Initialize Sentry BEFORE creating the NestJS application
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '3.8.25',
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Profiles sample rate
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Enable debug in development
    debug: process.env.NODE_ENV !== 'production',
    // Integrations
    integrations: [
      Sentry.httpIntegration(),
    ],
  });
}
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('========================================');
    logger.log('STARTING AMBRA BACKEND');
    logger.log('========================================');
    logger.log(`PORT: ${process.env.PORT || 3333}`);
    logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    logger.log(`SENTRY_DSN exists: ${!!process.env.SENTRY_DSN}`);
    logger.log('========================================');

    logger.log('[1/7] Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      rawBody: true,
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    logger.log('[1/7] ✓ NestJS application created');

    logger.log('[2/7] Applying Helmet...');
    app.use(helmet());
    logger.log('[2/7] ✓ Helmet applied');

    logger.log('[3/7] Applying Compression...');
    app.use(compression());
    logger.log('[3/7] ✓ Compression applied');

    logger.log('[4/7] Configuring CORS...');
    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3008',
          'https://ambra-console.pages.dev',
          'https://ambra-flow.pages.dev',
          'https://ambra-food.pages.dev',
        ];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        if (origin.match(/^https:\/\/.*\.pages\.dev$/)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    logger.log('[4/7] ✓ CORS configured');

    logger.log('[5/7] Applying global pipes...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    logger.log('[5/7] ✓ Global pipes applied');

    logger.log('[6/7] Applying exception filters and interceptors...');
    app.useGlobalFilters(new PrismaExceptionFilter());
    app.useGlobalInterceptors(new SentryInterceptor());
    logger.log('[6/7] ✓ Filters and interceptors applied');

    logger.log('[7/7] Setting up Swagger...');
    const config = new DocumentBuilder()
      .setTitle('Nodum Kernel API')
      .setDescription('Documentação da API para o Ecossistema Nodum')
      .setVersion('3.8.25-bank-grade')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('[7/7] ✓ Swagger configured');

    const port = process.env.PORT || 3333;
    const host = '0.0.0.0';
    
    logger.log(`Starting server on ${host}:${port}...`);
    await app.listen(port, host);
    
    logger.log('========================================');
    logger.log(`✅ APPLICATION RUNNING: http://${host}:${port}`);
    logger.log(`✅ SWAGGER UI: http://${host}:${port}/api/docs`);
    logger.log('========================================');
  } catch (error) {
    logger.error('========================================');
    logger.error('❌ FATAL ERROR DURING STARTUP');
    logger.error('========================================');
    logger.error(`Error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    logger.error('========================================');
    process.exit(1);
  }
}

bootstrap();
