import { GetStateQuery } from '@core/area/application/use-cases';
import { IssueErrorCodes, IssueErrorMessages } from '@core/issue/domain/errors';
import { IIssueRepository } from '@core/issue/domain/repositories';
import { FindProjectMemberQuery } from '@core/project/application/use-cases';
import { MemberErrorCodes, MemberErrorMessages } from '@core/project/domain/errors';
import { ProjectAccessPolicy } from '@core/project/domain/policy';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

import { UpdateIssueDto } from '../../dtos';

@Injectable()
export class UpdateIssueUseCase {
    constructor(
        @Inject('IIssueRepository')
        private readonly issueRepo: IIssueRepository,
        private readonly getState: GetStateQuery,
        private readonly getProjectMember: FindProjectMemberQuery,
        private readonly projectPolicy: ProjectAccessPolicy,
    ) {}

    async execute(id: string, slug: string, key: string, dto: UpdateIssueDto, userId: string) {
        try {
            const { project } = await this.projectPolicy.ensureProjectAccess(slug, userId, [
                'owner',
                'admin',
            ]);

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

            await this.validateContext(id, dto, project.id, key, userId);

            const result = await this.issueRepo.update(id, dto);

            return {
                success: result,
                message: result
                    ? 'Задача успешно обновлена'
                    : 'Не удалось обновить задачу: запись не найдена',
            };
        } catch (e) {
            if (e instanceof BaseException) {
                throw e;
            }

            throw new BaseException(
                {
                    code: IssueErrorCodes.UPDATE_FAILED,
                    message: IssueErrorMessages[IssueErrorCodes.UPDATE_FAILED],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private async validateContext(
        id: string,
        dto: UpdateIssueDto,
        projectId: string,
        key: string,
        userId: string,
    ) {
        if (dto.assigneeId) {
            const member = await this.getProjectMember.execute(projectId, dto.assigneeId);

            if (!member) {
                throw new BaseException(
                    {
                        code: MemberErrorCodes.NOT_FOUND,
                        message: MemberErrorMessages[MemberErrorCodes.NOT_FOUND],
                        details: [{ target: 'assignee' }],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }
        }

        if (dto.reporterId) {
            const member = await this.getProjectMember.execute(projectId, dto.reporterId);

            if (!member) {
                throw new BaseException(
                    {
                        code: MemberErrorCodes.NOT_FOUND,
                        message: MemberErrorMessages[MemberErrorCodes.NOT_FOUND],
                        details: [{ target: 'reporter' }],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }
        }

        if (dto.stateId) {
            await this.getState.execute(key, dto.stateId, userId);
        }

        if (dto.parentId) {
            if (dto.parentId === id) {
                throw new BaseException(
                    {
                        code: IssueErrorCodes.SELF_PARENT,
                        message: IssueErrorMessages[IssueErrorCodes.SELF_PARENT],
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }

            const parent = await this.issueRepo.findOne(dto.parentId, userId);

            if (!parent) {
                throw new BaseException(
                    {
                        code: IssueErrorCodes.PARENT_NOT_FOUND,
                        message: IssueErrorMessages[IssueErrorCodes.PARENT_NOT_FOUND],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }
        }
    }
}
