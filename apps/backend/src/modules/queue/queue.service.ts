import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('webhooks') private webhookQueue: Queue,
    @InjectQueue('emails') private emailQueue: Queue,
    @InjectQueue('reports') private reportQueue: Queue,
  ) {}

  async addWebhookJob(data: any) {
    await this.webhookQueue.add('process-webhook', data, {
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.log(`Added webhook job`);
  }

  async addEmailJob(data: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }) {
    await this.emailQueue.add('send-email', data, {
      removeOnComplete: true,
      attempts: 3,
    });
    this.logger.log(`Added email job to ${data.to}`);
  }

  async addReportJob(data: any) {
    await this.reportQueue.add('generate-report', data, {
      removeOnComplete: true,
    });
    this.logger.log(`Added report job`);
  }
}
