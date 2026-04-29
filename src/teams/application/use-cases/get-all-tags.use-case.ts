import { Inject, Injectable } from '@nestjs/common';
import { FindTagsQuery } from '../dtos';
import { ITeamsRepository } from '@core/teams/domain/repository';

@Injectable()
export class GetAllTagsUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(query: FindTagsQuery) {
        const safePage = Math.max(query.page ?? 1, 1);
        const safeLimit = Math.min(Math.max(query.limit ?? 20, 1), 50);
        const offset = (safePage - 1) * safeLimit;

        const { data, total } = await this.teamsRepo.findAllTags({
            search: query.search,
            limit: safeLimit,
            offset,
        });

        const totalPages = total === 0 ? 0 : Math.ceil(total / safeLimit);

        return {
            data,
            meta: {
                hasNextPage: safePage < totalPages,
                hasPrevPage: safePage > 1,
                total,
                totalPages,
                page: safePage,
                limit: safeLimit,
            },
        };
    }
}
