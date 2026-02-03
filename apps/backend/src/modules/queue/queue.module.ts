import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { WebhooksProcessor } from './processors/webhooks.processor';
import { EmailsProcessor } from './processors/emails.processor';
import { ReportsProcessor } from './processors/reports.processor';
import { CommunicationModule } from '../communication/communication.module'; // Needed for EmailsProcessor -> MailService

@Global()
@Module({
  imports: [
    CommunicationModule, // Import module that exports MailService
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        let connection: any = {};

        if (redisUrl) {
          const url = new URL(redisUrl);
          connection = {
            host: url.hostname,
            port: Number(url.port),
            username: url.username,
            password: url.password,
            // Upstash/Cloud Redis often requires TLS. 'rediss:' indicates secure.
            tls:
              url.protocol === 'rediss:'
                ? { rejectUnauthorized: false }
                : undefined,
          };
        } else {
          connection = {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get('REDIS_PORT') || 6379,
            password: configService.get('REDIS_PASSWORD'),
          };
        }

        return { connection };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'webhooks' },
      { name: 'emails' },
      { name: 'reports' },
    ),
  ],
  providers: [
    QueueService,
    WebhooksProcessor,
    EmailsProcessor,
    ReportsProcessor,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
