import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { ITeamMedia, TEAM_MEDIA_TOKEN } from '../../media/interfaces/team-media.interface';
import type { FileUploadDto } from '../../media/dtos';

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
            throw new NotFoundException({
                code: 'TEAM_NOT_FOUND',
                message: 'Команда не найдена',
            });
        }

        return this.mediaService.uploadTeamAvatar(team.id, fileDto, (url) =>
            this.teamsRepo.updateTeamAvatar(team.id, url),
        );
    };

    public updateTeamBanner = async (slug: string, fileDto: FileUploadDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new NotFoundException({
                code: 'TEAM_NOT_FOUND',
                message: 'Команда не найдена',
            });
        }

        return this.mediaService.uploadTeamBanner(team.id, fileDto, (url) =>
            this.teamsRepo.updateTeamBanner(team.id, url),
        );
    };

    public syncTags = async (slug: string, tags: string[]) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new NotFoundException({
                code: 'TEAM_NOT_FOUND',
                message: 'Команда не найдена',
            });
        }

        const normalizedTags = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
        const isSynced = await this.teamsRepo.syncTags(team.id, normalizedTags);

        if (!isSynced) {
            throw new InternalServerErrorException('Не удалось обновить теги команды');
        }

        return {
            success: true,
            message: 'Теги команды обновлены',
        };
    };
}
