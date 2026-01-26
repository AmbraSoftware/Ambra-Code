import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * NOTIFICATIONS MODULE v3.8.1
 * Responsável por alertas e atualizações em tempo real (WebSockets).
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    // Registramos o JwtModule localmente para que o WsJwtGuard
    // consiga validar os tokens de conexão dos Sockets.
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-cantapp',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationService],
  exports: [NotificationsGateway, NotificationService],
})
export class NotificationsModule {}
