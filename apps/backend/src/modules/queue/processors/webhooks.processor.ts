import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('webhooks')
export class WebhooksProcessor extends WorkerHost {
    private readonly logger = new Logger(WebhooksProcessor.name);

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing webhook job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'process-webhook':
                return this.handleWebhook(job.data);
            default:
                this.logger.warn(`Unknown job name: ${job.name}`);
        }
    }

    private async handleWebhook(data: any) {
        this.logger.log('Handling webhook payload...', data);
        // TODO: Implement actual webhook processing logic here (AsaasService linkage)
        // await this.asaasService.handleEvent(data);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating work
        return { processed: true };
    }
}
