import { Module, Global, forwardRef } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  providers: [AuditService],
  exports: [AuditService],
  controllers: [AuditController],
})
export class AuditModule {}
