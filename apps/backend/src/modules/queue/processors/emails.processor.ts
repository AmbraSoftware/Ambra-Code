import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../../communication/mail.service';

@Processor('emails')
export class EmailsProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailsProcessor.name);

    constructor(private readonly mailService: MailService) {
        super();
    }

    async process(job: Job<any, any, string>): Promise<any> {
        this.logger.log(`Processing email job ${job.id} of type ${job.name}`);

        // Example: job.data = { to, subject, template... }
        // Implement logic to call MailService
        // await this.mailService.sendGenericEmail(...)

        return { sent: true };
    }
}
