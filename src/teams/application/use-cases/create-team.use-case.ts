import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateTeamDto } from '../dtos';
import { BaseException } from '@shared/error';
import { slugify } from 'transliteration';

@Injectable()
export class CreateTeamUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(userId: string, dto: CreateTeamDto) {
        const baseSlug = slugify(dto.slug || dto.name, { lowercase: true, separator: '-' });
        const existingTeam = await this.teamsRepo.findBySlug(baseSlug);

        if (existingTeam) {
            throw new BaseException(
                {
                    code: 'SLUG_ALREADY_EXISTS',
                    message: `Ссылка "${baseSlug}" уже занята другой командой`,
                    details: [{ target: 'slug', value: baseSlug }],
                },
                HttpStatus.CONFLICT,
            );
        }

        const { tags, ...teamData } = dto;
        const uniqueTags = tags ? [...new Set(tags.map((tag) => tag.toLowerCase()))] : [];

        try {
            const result = await this.teamsRepo.create(
                userId,
                {
                    ...teamData,
                    slug: baseSlug,
                },
                uniqueTags,
            );

            return {
                ...result,
                slug: baseSlug,
                message: 'Команда успешно создана',
            };
        } catch (error) {
            throw new BaseException(
                {
                    code: 'TEAM_CREATE_FAILED',
                    message: 'Не удалось создать команду',
                    details: [{ reason: error instanceof Error ? error.message : 'Unknown error' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
