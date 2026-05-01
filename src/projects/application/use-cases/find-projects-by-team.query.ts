import { Inject, Injectable } from '@nestjs/common';
import { ProjectsMapper } from '../mappers';
import { IProjectsRepository } from '@core/projects/domain/repository';
import { ProjectAccessPolicy } from '@core/projects/domain/policy';

@Injectable()
export class FindProjectsByTeamQuery {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
        private readonly policy: ProjectAccessPolicy,
    ) {}

    public async execute(slug: string, userId: string) {
        const { team, member } = await this.policy.ensureTeamAccess(slug, userId, 'viewer');
        const projects = await this.projectsRepo.findByTeam(team.id);

        return {
            team: {
                id: team.id,
                name: team.name,
                slug: team.slug,
                role: member.role,
            },
            items: projects.map((p) => ProjectsMapper.toListResponse(p, member)),
            meta: {
                total: projects.length,
            },
        };
    }
}
