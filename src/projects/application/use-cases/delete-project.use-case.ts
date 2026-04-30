import { ProjectAccessPolicy } from '@core/projects/domain/policy';
import { IProjectsRepository } from '@core/projects/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class DeleteProjectUseCase {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(id: string, slug: string, userId: string) {
        const { project } = await this.policy.validateProjectAccess(id, slug, userId, 'admin');
        const result = await this.projectsRepo.delete(project.id);

        if (!result) {
            throw new BaseException(
                {
                    code: 'DELETE_FAILED',
                    message: 'Не удалось удалить проект',
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        return {
            success: true,
            message: result
                ? `Проект ${project.name} успешно перемещен в корзину`
                : 'Не удалось удалить проект, попробуйте позже',
        };
    }
}
