import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';
import { BaseException } from '@shared/error';
import { FindTeamMemberQuery, FindTeamQuery } from '@core/teams';
import { ROLE_PRIORITY } from '@shared/constants';

@Injectable()
export class ProjectAccessPolicy {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly findTeamQ: FindTeamQuery,
        private readonly findTeamMemberQ: FindTeamMemberQuery,
    ) {}

    /**
     * Проверка доступа к команде (используется, например, при создании проекта)
     */
    public async ensureTeamAccess(
        slug: string,
        userId: string,
        minRole: keyof typeof ROLE_PRIORITY = 'viewer',
    ) {
        const team = await this.findTeamQ.execute(slug);
        if (!team) {
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: 'Команда не найдена' },
                HttpStatus.NOT_FOUND,
            );
        }

        const member = await this.findTeamMemberQ.execute(team.id, userId);
        if (!member) {
            throw new BaseException(
                { code: 'NOT_TEAM_MEMBER', message: 'Вы не участник команды' },
                HttpStatus.FORBIDDEN,
            );
        }

        if (ROLE_PRIORITY[member.role] < ROLE_PRIORITY[minRole]) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Требуется роль ${minRole} или выше`,
                    details: [{ target: 'role', current: member.role, required: minRole }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        return { team, member };
    }

    /**
     * Полная проверка доступа к конкретному проекту внутри команды
     */
    public async validateProjectAccess(
        projectId: string,
        slug: string,
        userId: string,
        minRole: keyof typeof ROLE_PRIORITY = 'admin',
    ) {
        const { team, member } = await this.ensureTeamAccess(slug, userId, minRole);

        const project = await this.projectsRepo.findOne(projectId);
        if (!project || project.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'PROJECT_NOT_FOUND',
                    message: 'Проект не найден в этой команде',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return { project, member, team };
    }
}
