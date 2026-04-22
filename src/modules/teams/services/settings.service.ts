import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { ITeamMedia, TEAM_MEDIA_TOKEN, type FileUploadDto } from '../../media';
import { BaseException } from '@shared/error';

@Injectable()
export class TeamsSettingsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @Inject(TEAM_MEDIA_TOKEN)
        private readonly mediaService: ITeamMedia,
    ) {}

    public updateTeamAvatar = async (slug: string, fileDto: FileUploadDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                    details: [{ target: 'slug', value: slug }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return this.mediaService.uploadTeamAvatar(team.id, fileDto, (url) =>
            this.teamsRepo.updateTeamAvatar(team.id, url),
        );
    };

    public updateTeamBanner = async (slug: string, fileDto: FileUploadDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                    details: [{ target: 'slug', value: slug }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return this.mediaService.uploadTeamBanner(team.id, fileDto, (url) =>
            this.teamsRepo.updateTeamBanner(team.id, url),
        );
    };

    public syncTags = async (slug: string, tags: string[]) => {
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

        const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
        const isSynced = await this.teamsRepo.syncTags(team.id, normalizedTags);

        if (!isSynced) {
            throw new BaseException(
                {
                    code: 'TAGS_SYNC_FAILED',
                    message: 'Не удалось обновить теги команды. Попробуйте позже.',
                    details: [{ target: 'tags', count: normalizedTags.length }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: 'Теги команды обновлены',
        };
    };
}
