import { ReorderIssuesUseCase } from '@core/issue/application/use-cases';
import { IssueJobs, IssueQueue } from '@core/issue/domain/enums';
import { ReorderIssuesEvent } from '@core/issue/domain/events';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

@Injectable()
@Processor(IssueQueue.ISSUE)
export class ReorderStateProcessor extends WorkerHost {
    constructor(private readonly reorderIssuesUC: ReorderIssuesUseCase) {
        super();
    }

    async process(job: Job<ReorderIssuesEvent>): Promise<void> {
        await job.log(`[START] Job ID: ${job.id} | Type: ${job.name}`);

        try {
            switch (job.name) {
                case IssueJobs.REORDER_ISSUES:
                    await this.handleReorderIssues(job);
                    break;

                default:
                    await job.log(`[WRN] No handler for job: ${job.name}`);
                    await job.updateProgress(100);
            }

            await job.log(`[DONE] Job ${job.id} processed`);
        } catch (error) {
            await job.log(String(error));
            throw error;
        }
    }

    private readonly handleReorderIssues = async (job: Job<ReorderIssuesEvent>) => {
        await job.log(`[INFO] Reordering issues in states with ID: ${job.data.stateId}`);
        await job.updateProgress(20);

        await this.reorderIssuesUC.execute(job.data.stateId);

        await job.log(`[INFO] Finished reordering issues in state with ID: ${job.data.stateId}`);
        await job.updateProgress(100);
    };
}
