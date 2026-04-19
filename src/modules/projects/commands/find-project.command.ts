import {
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { IProjectsRepository } from '../repository';
import { FindTeamMemberCommand } from '@core/modules/teams';
import { createHash } from 'crypto';
import type { Project } from '../entities';

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
            throw new NotFoundException('Проект не найден или доступ ограничен');
        }

        if (shareToken) {
            return this.findPublic(project, shareToken);
        }

        return this.findPrivate(project, userId);
    }

    private findPrivate = async (project: Project, userId?: string) => {
        if (!userId) {
            throw new UnauthorizedException('Для доступа к приватному проекту нужна авторизация');
        }

        const member = await this.findTeamMemberCommand.execute(project.teamId, userId);

        if (!member) {
            throw new ForbiddenException('У вас нет прав для просмотра этого проекта');
        }

        return { project, member };
    };

    private findPublic = async (project: Project, token: string) => {
        if (project.visibility !== 'public') {
            throw new ForbiddenException('Этот проект не является публичным');
        }

        const hashedToken = createHash('sha256').update(token).digest('hex');
        const isValidToken = await this.projectsRepo.hasValidShareToken(project.id, hashedToken);

        if (!isValidToken) {
            throw new NotFoundException('Ссылка недействительна или срок её действия истек');
        }

        return { project, member: null };
    };
}
