import { ProjectStatus } from '@core/projects/domain/entities';
import { ProjectAccessPolicy } from '@core/projects/domain/policy';
import { IProjectsRepository } from '@core/projects/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class SetProjectStatusUseCase {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(id: string, slug: string, userId: string, status: ProjectStatus) {
        const { project } = await this.policy.validateProjectAccess(id, slug, userId);
        const result = await this.projectsRepo.update(project.id, { status });

        if (!result) {
            throw new BaseException(
                {
                    code: 'STATUS_UPDATE_FAILED',
                    message: 'Не удалось обновить статус проекта',
                    details: [{ target: 'status', value: status }],
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        const messages: Record<ProjectStatus, string> = {
            archived: `Проект «${project.name}» успешно архивирован`,
            active: `Проект «${project.name}» теперь активен`,
            template: `Проект «${project.name}» успешно сохранен как шаблон`,
        };

        return {
            success: result,
            message: messages[status] || `Статус проекта «${project.name}» изменен`,
        };
    }
}
