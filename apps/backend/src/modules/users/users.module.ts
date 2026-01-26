import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

import { ConsentController } from './consent.controller';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [UsersController, ConsentController, SubscriptionsController],
  providers: [UsersService],
})
export class UsersModule {}
