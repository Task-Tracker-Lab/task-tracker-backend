import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { IMailPort } from '@shared/adapters/mail';
import { Inject } from '@nestjs/common';
import { TeamInvitationEvent } from '@core/teams/domain/events';
import { TeamQueues } from '@core/teams/domain/enums';

@Processor(TeamQueues.TEAM_MAIL)
export class MailProcessor extends WorkerHost {
    constructor(
        @Inject('IMailPort')
        private readonly mailAdapter: IMailPort,
    ) {
        super();
    }

    async process(job: Job<TeamInvitationEvent>): Promise<void> {
        await job.log(`[START] Job ID: ${job.id} | Type: ${job.name}`);

        try {
            await this.sendTeamInvitation(job);

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

    private sendTeamInvitation = async (job: Job<TeamInvitationEvent>) => {
        const { email, teamName, inviteUrl } = job.data;

        await job.log(`Sending team(${teamName}) invitation link to: ${email}`);
        await job.updateProgress(30);

        await this.mailAdapter.sendTeamInvitation(email, teamName, inviteUrl);

        await job.log(`Team invitation link delivered to ${email}`);
        await job.updateProgress(100);
    };
}
