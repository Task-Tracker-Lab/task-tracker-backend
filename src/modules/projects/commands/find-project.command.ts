import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';
import { FindTeamMemberCommand } from '@core/modules/teams';
import { createHash } from 'crypto';
import type { Project } from '../entities';
import { BaseException } from '@shared/error';

@Injectable()
export class FindProjectCommand {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly findTeamMemberCommand: FindTeamMemberCommand,
    ) {}

    public async execute(projectId: string, userId?: string, shareToken?: string) {
        const project = await this.projectsRepo.findOne(projectId);

        if (!project) {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Проект не найден или доступ ограничен',
                    details: [{ target: 'projectId', value: projectId }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (shareToken) {
            return this.findPublic(project, shareToken);
        }

        return this.findPrivate(project, userId);
    }

    private findPrivate = async (project: Project, userId?: string) => {
        if (!userId) {
            throw new BaseException(
                {
                    code: 'AUTH_REQUIRED',
                    message: 'Для доступа к приватному проекту нужна авторизация',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const member = await this.findTeamMemberCommand.execute(project.teamId, userId);

        if (!member) {
            throw new BaseException(
                {
                    code: 'ACCESS_DENIED',
                    message: 'У вас нет прав для просмотра этого проекта',
                    details: [{ target: 'teamId', value: project.teamId }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        return { project, member };
    };

    private findPublic = async (project: Project, token: string) => {
        if (project.visibility !== 'public') {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_PUBLIC',
                    message: 'Этот проект не является публичным',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const hashedToken = createHash('sha256').update(token).digest('hex');
        const isValidToken = await this.projectsRepo.hasValidShareToken(project.id, hashedToken);

        if (!isValidToken) {
            throw new BaseException(
                {
                    code: 'SHARE_LINK_INVALID',
                    message: 'Ссылка недействительна или срок её действия истек',
                },
                HttpStatus.GONE,
            );
        }

        return { project, member: null };
    };
}
