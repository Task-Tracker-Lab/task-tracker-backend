import { Injectable } from '@nestjs/common';
import { ProjectsMapper } from '../mappers';
import { FindProjectQuery } from './find-project.query';

@Injectable()
export class GetProjectDetailQuery {
    constructor(private readonly findProjectQuery: FindProjectQuery) {}

    public async execute(id: string, slug: string, userId?: string, token?: string) {
        const { project, member } = await this.findProjectQuery.execute(
            id,
            slug,
            userId,
            token,
            'viewer',
        );

        return ProjectsMapper.toDetailResponse(project, member);
    }
}
