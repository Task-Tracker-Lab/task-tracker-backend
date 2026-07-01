import { GetAreaQuery, GetStateQuery } from '@core/area/application/use-cases';
import { IssueJobs, IssueQueue } from '@core/issue/domain/enums';
import { IssueErrorCodes, IssueErrorMessages } from '@core/issue/domain/errors';
import { ReorderIssuesEvent } from '@core/issue/domain/events';
import { IIssueRepository } from '@core/issue/domain/repositories';
import { REORDER_TRIGGER } from '@core/issue/infrastructure/constants';
import { ProjectAccessPolicy } from '@core/project/domain/policy';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import { Queue } from 'bullmq';

import { MoveIssueDto } from '../../dtos';

@Injectable()
export class MoveIssueUseCase {
    constructor(
        @Inject('IIssueRepository')
        private readonly issueRepo: IIssueRepository,
        @InjectQueue(IssueQueue.ISSUE)
        private readonly issueQueue: Queue,
        private readonly getArea: GetAreaQuery,
        private readonly getState: GetStateQuery,
        private readonly projectPolicy: ProjectAccessPolicy,
    ) {}

    async execute(id: string, slug: string, key: string, dto: MoveIssueDto, userId: string) {
        try {
            await this.projectPolicy.ensureProjectAccess(slug, userId, ['owner', 'admin']);

            const issue = await this.issueRepo.findOne(id, userId);

            if (!issue) {
                throw new BaseException(
                    {
                        code: IssueErrorCodes.NOT_FOUND,
                        message: IssueErrorMessages[IssueErrorCodes.NOT_FOUND],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }

            await this.validateContext(dto, key, userId);

            const data = {
                position: dto.position,
                areaId: dto.targetAreaId ?? issue.areaId,
                stateId: dto.targetStateId ?? issue.stateId,
            };

            await this.issueRepo.update(id, data);

            // await this.checkReorder(dto, issue.stateId);

            return {
                success: true,
                message: 'Задача успешно перемещена',
            };
        } catch (e) {
            if (e instanceof BaseException) {
                throw e;
            }

            throw new BaseException(
                {
                    code: IssueErrorCodes.MOVE_FAILED,
                    message: IssueErrorMessages[IssueErrorCodes.MOVE_FAILED],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private async validateContext(dto: MoveIssueDto, key: string, userId: string) {
        if (dto.targetAreaId) {
            await this.getArea.execute({ key }, userId);
        }
        if (dto.targetStateId) {
            await this.getState.execute(key, dto.targetStateId, userId);
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    private async checkReorder(dto: MoveIssueDto, currentStateId: string | null) {
        const prev = dto.prevIssuePosition;
        const next = dto.nextIssuePosition;

        let distance = Infinity;

        if (prev !== null && next !== null) {
            distance = Math.abs(next - prev);
        } else if (prev !== null) {
            distance = Math.abs(dto.position - prev);
        } else if (next !== null) {
            distance = Math.abs(next - dto.position);
        }

        if (distance < REORDER_TRIGGER) {
            const stateId = dto.targetStateId ?? currentStateId;
            const event = new ReorderIssuesEvent(stateId!);
            await this.issueQueue.add(IssueJobs.REORDER_ISSUES, event);
        }
    }
}
