import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { FindTeamMemberQuery, FindTeamQuery } from '@core/teams';
import { createHash } from 'crypto';
import { BaseException } from '@shared/error';
import { ROLE_PRIORITY } from '@shared/constants';
import { IProjectsRepository } from '@core/projects/domain/repository';
import type { Project } from '@core/projects/domain/entities';

@Injectable()
export class FindProjectQuery {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly findTeamQ: FindTeamQuery,
        private readonly findTeamMemberQ: FindTeamMemberQuery,
    ) {}

    /**
     * Точка входа для получения проекта с проверкой прав.
     */
    public async execute(
        projectId: string,
        slug: string,
        userId?: string,
        shareToken?: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
    ) {
        const project = await this.projectsRepo.findOne(projectId);

        if (!project) {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Проект не найден',
                    details: [{ target: 'projectId', value: projectId }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (shareToken) {
            return this.findPublic(project, shareToken);
        }

        return this.findPrivate(project, slug, userId, minRole);
    }

    private findPrivate = async (
        project: Project,
        slug: string,
        userId?: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
    ) => {
        if (!userId) {
            throw new BaseException(
                {
                    code: 'AUTH_REQUIRED',
                    message: 'Требуется авторизация для доступа к приватному проекту',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const team = await this.findTeamQ.execute(slug);
        if (!team || team.id !== project.teamId) {
            throw new BaseException(
                {
                    code: 'PROJECT_TEAM_MISMATCH',
                    message: 'Проект не принадлежит указанной команде',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const member = await this.findTeamMemberQ.execute(team.id, userId);
        if (!member) {
            throw new BaseException(
                { code: 'ACCESS_DENIED', message: 'Вы не являетесь участником этой команды' },
                HttpStatus.FORBIDDEN,
            );
        }

        if (ROLE_PRIORITY[member.role] < ROLE_PRIORITY[minRole]) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Для этого действия необходимы права: ${minRole}`,
                },
                HttpStatus.FORBIDDEN,
            );
        }

        return { project, member, team };
    };

    private findPublic = async (project: Project, token: string) => {
        if (project.visibility !== 'public') {
            throw new BaseException(
                { code: 'PROJECT_NOT_PUBLIC', message: 'Публичный доступ к проекту ограничен' },
                HttpStatus.FORBIDDEN,
            );
        }

        const hashedToken = createHash('sha256').update(token).digest('hex');
        const isValidToken = await this.projectsRepo.hasValidShareToken(project.id, hashedToken);

        if (!isValidToken) {
            throw new BaseException(
                { code: 'SHARE_LINK_INVALID', message: 'Ссылка недействительна или истекла' },
                HttpStatus.GONE,
            );
        }

        return { project, member: null, team: null };
    };
}
