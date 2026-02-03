import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('reports')
export class ReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing report job ${job.id}`);
    // Heavy calculation logic here
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return { generated: true };
  }
}
