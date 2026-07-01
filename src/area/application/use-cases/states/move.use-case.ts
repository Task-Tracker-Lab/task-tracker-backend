import { StateJobs, StateQueues } from '@core/area/domain/enums';
import {
    AreaErrorCodes,
    AreaErrorMessages,
    StateErrorCodes,
    StateErrorMessages,
} from '@core/area/domain/errors';
import { ReorderStatesEvent } from '@core/area/domain/events';
import { IAreaRepository, IStateRepository } from '@core/area/domain/repository';
import { REORDER_TRIGGER } from '@core/area/infrastructure/constants';
import { ProjectAccessPolicy } from '@core/project/domain/policy';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import { Queue } from 'bullmq';

import { MoveStateDto } from '../../dtos';

@Injectable()
export class MoveStateUseCase {
    constructor(
        @Inject('IStateRepository')
        private readonly stateRepo: IStateRepository,
        @Inject('IAreaRepository')
        private readonly areaRepo: IAreaRepository,
        @InjectQueue(StateQueues.STATE)
        private readonly stateQueue: Queue,
        private readonly projectPolicy: ProjectAccessPolicy,
    ) {}

    async execute(slug: string, stateId: string, dto: MoveStateDto, userId: string) {
        try {
            await this.projectPolicy.ensureProjectAccess(slug, userId, ['owner', 'admin']);

            const area = await this.areaRepo.findBySlug(slug);

            if (!area) {
                throw new BaseException(
                    {
                        code: AreaErrorCodes.NOT_FOUND,
                        message: AreaErrorMessages[AreaErrorCodes.NOT_FOUND],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }

            const state = await this.stateRepo.findOne(area.id, stateId);

            if (!state) {
                throw new BaseException(
                    {
                        code: StateErrorCodes.NOT_FOUND,
                        message: StateErrorMessages[StateErrorCodes.NOT_FOUND],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }

            if (state.isLocked) {
                throw new BaseException(
                    {
                        code: StateErrorCodes.LOCKED,
                        message: StateErrorMessages[StateErrorCodes.LOCKED],
                    },
                    HttpStatus.CONFLICT,
                );
            }

            const { position } = dto;

            await this.stateRepo.update(area.id, stateId, { position });

            // await this.checkReorder(dto, area.id);

            return {
                success: true,
                message: 'Состояние успешно перемещено',
            };
        } catch (err) {
            if (err instanceof BaseException) {
                throw err;
            }

            throw new BaseException(
                {
                    code: StateErrorCodes.REORDER_FAILED,
                    message: StateErrorMessages[StateErrorCodes.REORDER_FAILED],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    private async checkReorder(dto: MoveStateDto, areaId: string) {
        const prev = dto.prevStatePosition;
        const next = dto.nextStatePosition;

        let distance = Infinity;

        if (prev !== null && next !== null) {
            distance = Math.abs(next - prev);
        } else if (prev !== null) {
            distance = Math.abs(dto.position - prev);
        } else if (next !== null) {
            distance = Math.abs(next - dto.position);
        }

        if (distance < REORDER_TRIGGER) {
            const event = new ReorderStatesEvent(areaId);
            await this.stateQueue.add(StateJobs.REORDER_STATES, event);
        }
    }
}
