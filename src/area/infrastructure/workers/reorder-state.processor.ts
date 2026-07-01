import { StateJobs, StateQueues } from '@core/area/domain/enums';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';

import { ReorderStatesUseCase } from '../../application/use-cases';
import { ReorderStatesEvent } from '../../domain/events';

@Injectable()
@Processor(StateQueues.STATE)
export class ReorderStateProcessor extends WorkerHost {
    constructor(private readonly reorderState: ReorderStatesUseCase) {
        super();
    }

    async process(job: Job<ReorderStatesEvent>): Promise<void> {
        await job.log(`[START] Job ID: ${job.id} | Type: ${job.name}`);

        try {
            switch (job.name) {
                case StateJobs.REORDER_STATES:
                    await this.handleReorderState(job);
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

    private readonly handleReorderState = async (job: Job<ReorderStatesEvent>) => {
        await job.log(`[INFO] Reordering states in area with ID: ${job.data.areaId}`);
        await job.updateProgress(20);

        await this.reorderState.execute(job.data.areaId);

        await job.log(`[INFO] Finished reordering states in area with ID: ${job.data.areaId}`);
        await job.updateProgress(100);
    };
}
