import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class SyncTeamTagsUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string, tags: string[]) {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const normalizedTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];

        const isSynced = await this.teamsRepo.syncTags(team.id, normalizedTags);

        if (!isSynced) {
            throw new BaseException(
                {
                    code: 'TAGS_SYNC_FAILED',
                    message: 'Не удалось обновить теги команды',
                    details: [{ target: 'tags', count: normalizedTags.length }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: 'Теги команды успешно обновлены',
        };
    }
}
