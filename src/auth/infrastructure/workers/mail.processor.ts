import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { IMailPort } from '@shared/adapters/mail';
import { Inject } from '@nestjs/common';
import { RegisterCodeEvent, ResetPasswordEvent } from '../../domain/events';
import { AuthMailJobs, AuthQueues } from '../../domain/enums';

@Processor(AuthQueues.AUTH_MAIL)
export class MailProcessor extends WorkerHost {
    constructor(
        @Inject('IMailPort')
        private readonly mailAdapter: IMailPort,
    ) {
        super();
    }

    async process(job: Job<RegisterCodeEvent>): Promise<void>;
    async process(job: Job<ResetPasswordEvent>): Promise<void>;
    async process(job: Job<any>): Promise<void> {
        await job.log(`[START] Job ID: ${job.id} | Type: ${job.name}`);

        try {
            switch (job.name) {
                case AuthMailJobs.SEND_REGISTER_CODE:
                    await this.sendRegisterCode(job);
                    break;
                case AuthMailJobs.SEND_RESET_PASSWORD:
                    await this.sendResetPassCode(job);
                    break;
                default:
                    await job.log(`[WRN] No handler for job: ${job.name}`);
                    await job.updateProgress(100);
            }

            await job.log(`[DONE] Job ${job.id} processed`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : '';

            await job.log(`[FAIL] ${errorMessage}`);
            if (errorStack) {
                await job.log(errorStack);
            }

            throw error;
        }
    }

    private sendRegisterCode = async (job: Job<RegisterCodeEvent>) => {
        const { email, name, otp } = job.data;

        await job.log(`Sending registration code to: ${email}`);
        await job.updateProgress(20);

        await this.mailAdapter.sendRegistrationCode(email, name, otp);

        await job.log(`Successfully sent to ${email}`);
        await job.updateProgress(100);
    };

    private sendResetPassCode = async (job: Job<ResetPasswordEvent>) => {
        const { email, otp } = job.data;

        await job.log(`Sending password reset to: ${email}`);
        await job.updateProgress(30);

        await this.mailAdapter.sendResetPasswordCode(email, otp);

        await job.log(`Reset link delivered to ${email}`);
        await job.updateProgress(100);
    };
}
