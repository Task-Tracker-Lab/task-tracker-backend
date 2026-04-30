import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { UpdateProjectDto } from '../dtos';
import { BaseException } from '@shared/error';
import { IProjectsRepository } from '@core/projects/domain/repository';
import { ProjectAccessPolicy } from '@core/projects/domain/policy';

@Injectable()
export class UpdateProjectUseCase {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(id: string, slug: string, userId: string, dto: UpdateProjectDto) {
        const { project } = await this.policy.validateProjectAccess(id, slug, userId);
        const { isPublic, key, ...data } = dto;

        const result = await this.projectsRepo.update(project.id, {
            ...data,
            ...(key && { key: key.toUpperCase() }),
            ...(typeof isPublic === 'boolean' && {
                visibility: isPublic ? 'public' : 'private',
            }),
        });

        if (!result) {
            throw new BaseException(
                {
                    code: 'UPDATE_FAILED',
                    message:
                        'Изменения не были применены. Возможно, данные идентичны текущим или проект недоступен',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        return {
            success: result,
            message: result ? 'Настройки проекта успешно обновлены' : 'Изменения не были применены',
        };
    }
}
