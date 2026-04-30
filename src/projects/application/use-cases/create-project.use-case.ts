import { Inject, Injectable } from '@nestjs/common';
import type { CreateProjectDto } from '../dtos';
import { IProjectsRepository } from '@core/projects/domain/repository';
import { ProjectStatus } from '@core/projects/domain/entities';
import { ProjectAccessPolicy } from '@core/projects/domain/policy';

@Injectable()
export class CreateProjectUseCase {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(userId: string, slug: string, dto: CreateProjectDto) {
        const { team } = await this.policy.ensureTeamAccess(slug, userId, 'admin');

        const data = {
            ...dto,
            teamId: team.id,
            ownerId: userId,
            key: dto.key.toUpperCase(),
            status: ProjectStatus.Active,
        };

        const { result, id } = await this.projectsRepo.create(data);

        return {
            success: result,
            message: `Проект ${dto.name} успешно создан`,
            projectId: id,
        };
    }
}
