import { IssueErrorCodes, IssueErrorMessages } from '@core/issue/domain/errors';
import { IIssueRepository } from '@core/issue/domain/repositories';
import { FindProjectMemberQuery } from '@core/project/application/use-cases';
import { MemberErrorCodes, MemberErrorMessages } from '@core/project/domain/errors';
import { ProjectAccessPolicy } from '@core/project/domain/policy';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

import { AssignIssueDto } from '../../dtos';

@Injectable()
export class AssignIssueUseCase {
    constructor(
        @Inject('IIssueRepository')
        private readonly issueRepo: IIssueRepository,
        private readonly getProjectMember: FindProjectMemberQuery,
        private readonly projectPolicy: ProjectAccessPolicy,
    ) {}

    async execute(id: string, slug: string, dto: AssignIssueDto, userId: string) {
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

            if (dto.assigneeId) {
                const member = await this.getProjectMember.execute(project.id, dto.assigneeId);

                if (!member) {
                    throw new BaseException(
                        {
                            code: MemberErrorCodes.NOT_FOUND,
                            message: MemberErrorMessages[MemberErrorCodes.NOT_FOUND],
                        },
                        HttpStatus.NOT_FOUND,
                    );
                }
            }

            const result = await this.issueRepo.update(id, { assigneeId: dto.assigneeId });

            return {
                success: result,
                message: result
                    ? dto.assigneeId
                        ? 'Исполнитель успешно назначен'
                        : 'Исполнитель успешно снят'
                    : 'Не удалось назначить исполнителя',
            };
        } catch (e) {
            if (e instanceof BaseException) {
                throw e;
            }

            throw new BaseException(
                {
                    code: IssueErrorCodes.ASSIGN_FAILED,
                    message: IssueErrorMessages[IssueErrorCodes.ASSIGN_FAILED],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
