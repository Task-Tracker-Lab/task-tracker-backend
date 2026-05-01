import { ITeamsRepository } from '@core/teams/domain/repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class CheckTeamSlugQuery {
    constructor(@Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository) {}

    async execute(slug: string) {
        const normalizedSlug = slug.trim().toLowerCase();

        const available = await this.teamsRepo.isSlugAvailable(normalizedSlug);

        return {
            available,
            message: available
                ? `Slug ${normalizedSlug} доступен для использования`
                : `Slug ${normalizedSlug} уже занят`,
        };
    }
}
