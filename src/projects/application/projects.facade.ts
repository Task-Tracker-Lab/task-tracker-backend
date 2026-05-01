import { Injectable } from '@nestjs/common';
import { ProjectStatus } from '../domain/entities';
import type { CreateProjectDto, CreateShareTokenDto, UpdateProjectDto } from './dtos';
import {
    CreateProjectUseCase,
    DeleteProjectUseCase,
    GenerateShareTokenUseCase,
    SetProjectStatusUseCase,
    UpdateProjectUseCase,
    FindProjectsByTeamQuery,
    GetProjectDetailQuery,
} from './use-cases';

@Injectable()
export class ProjectsFacade {
    constructor(
        private readonly createProjectUC: CreateProjectUseCase,
        private readonly updateProjectUC: UpdateProjectUseCase,
        private readonly deleteProjectUC: DeleteProjectUseCase,
        private readonly setStatusUC: SetProjectStatusUseCase,
        private readonly generateTokenUC: GenerateShareTokenUseCase,
        private readonly getDetailQ: GetProjectDetailQuery,
        private readonly findByTeamQ: FindProjectsByTeamQuery,
    ) {}

    public async create(userId: string, slug: string, dto: CreateProjectDto) {
        return this.createProjectUC.execute(userId, slug, dto);
    }

    public async update(id: string, slug: string, userId: string, dto: UpdateProjectDto) {
        return this.updateProjectUC.execute(id, slug, userId, dto);
    }

    public async delete(id: string, slug: string, userId: string) {
        return this.deleteProjectUC.execute(id, slug, userId);
    }

    public async setStatus(id: string, slug: string, userId: string, status: ProjectStatus) {
        return this.setStatusUC.execute(id, slug, userId, status);
    }

    public async generateShareToken(
        id: string,
        slug: string,
        userId: string,
        dto: CreateShareTokenDto,
    ) {
        return this.generateTokenUC.execute(id, slug, userId, dto);
    }

    public async getDetail(id: string, slug: string, userId?: string, token?: string) {
        return this.getDetailQ.execute(id, slug, userId, token);
    }

    public async getTeamProjects(slug: string, userId: string) {
        return this.findByTeamQ.execute(slug, userId);
    }
}
