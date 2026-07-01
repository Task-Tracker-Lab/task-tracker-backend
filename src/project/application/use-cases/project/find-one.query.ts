import { createHash } from 'node:crypto';

import { ProjectErrorCodes, ProjectErrorMessages } from '@core/project/domain/errors';
import { IProjectRepository } from '@core/project/domain/repository';
import { FindTeamMemberQuery, FindTeamQuery } from '@core/team';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { isTeamRole, ROLE_PRIORITY } from '@shared/constants';
import { BaseException } from '@shared/error';

import type { Project } from '@core/project/domain/entities';

@Injectable()
export class FindProjectQuery {
    constructor(
        @Inject('IProjectRepository')
        private readonly projectsRepo: IProjectRepository,
        private readonly findTeamQ: FindTeamQuery,
        private readonly findTeamMemberQ: FindTeamMemberQuery,
    ) {}

    public async execute(
        slug: string,
        teamId: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
        shareToken?: string,
        userId?: string,
    ) {
        const project = await this.projectsRepo.findBySlug(slug, teamId);

        if (!project) {
            throw new BaseException(
                {
                    code: ProjectErrorCodes.NOT_FOUND,
                    message: ProjectErrorMessages[ProjectErrorCodes.NOT_FOUND],
                    details: [{ target: 'slug', value: slug }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (shareToken) {
            return this.findPublic(project, shareToken);
        }

        return this.findPrivate(project, teamId, userId, minRole);
    }

    private readonly findPrivate = async (
        project: Project,
        teamId: string,
        userId?: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
    ) => {
        if (!userId) {
            throw new BaseException(
                {
                    code: 'AUTH_REQUIRED',
                    message: 'Требуется авторизация для доступа к проекту',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const team = await this.findTeamQ.execute(teamId);
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

        if (isTeamRole(member.role) && ROLE_PRIORITY[member.role] < ROLE_PRIORITY[minRole]) {
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

    private readonly findPublic = async (project: Project, token: string) => {
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
