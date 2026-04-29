import { FileUploadDto, ITeamMedia, TEAM_MEDIA_TOKEN } from '@core/modules/media';
import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class UpdateTeamAvatarUseCase {
    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @Inject(TEAM_MEDIA_TOKEN) private readonly mediaService: ITeamMedia,
    ) {}

    async execute(slug: string, fileDto: FileUploadDto) {
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
    }
}
