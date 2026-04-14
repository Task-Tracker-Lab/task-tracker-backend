import {
    Inject,
    Injectable,
    InternalServerErrorException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { FindTagsQuery } from '../dtos';
import { ITeamMedia, TEAM_MEDIA_TOKEN } from '../../media/interfaces/team-media.interface';
import type { FileUploadDto } from '../../media/dtos';
import type { CreateTeamDto, UpdateTeamDto } from '../dtos';
import { slugify } from 'transliteration';
import { TeamMemberMapper } from '../mappers';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class TeamsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @Inject(TEAM_MEDIA_TOKEN)
        private readonly mediaService: ITeamMedia,
        @InjectRedis()
        private readonly redis: Redis,
    ) {}

    public checkSlug = async (slug: string) => {
        const available = await this.teamsRepo.isSlugAvailable(slug);
        return { available };
    };

    public getMyInvites = async (email: string) => {
        const codes = await this.redis.smembers(`user:invites:${email}`);

        if (!codes.length) return [];

        const results = await this.redis.mget(codes.map((c) => `inv:code:${c}`));

        return results
            .map((raw, i) => TeamMemberMapper.toPublicInvite(raw, codes[i]))
            .filter(Boolean);
    };

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

    public create = async (userId: string, dto: CreateTeamDto) => {
        const baseSlug = slugify(dto.slug || dto.name, { lowercase: true, separator: '-' });
        const existingTeam = await this.teamsRepo.findBySlug(baseSlug);

        if (existingTeam) {
            throw new ConflictException(`Команда со ссылкой "${baseSlug}" уже существует`);
        }

        const { tags, ...teamData } = dto;

        try {
            const result = await this.teamsRepo.create(
                userId,
                {
                    ...teamData,
                    slug: baseSlug,
                },
                tags,
            );

            return {
                ...result,
                slug: baseSlug,
                message: 'Команда успешно создана',
            };
        } catch (error) {
            throw error;
        }
    };

    public update = async (slug: string, userId: string, dto: UpdateTeamDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new NotFoundException(`Команда ${slug} не найдена`);
        }

        const member = await this.teamsRepo.findMember(team.id, userId);

        const canEdit = member?.role === 'admin' || member?.role === 'owner';

        if (!canEdit) {
            throw new ForbiddenException('У вас нет прав для выполнения этой команды');
        }

        const { tags, ...data } = dto;

        try {
            const result = await this.teamsRepo.update(team.id, data, tags);

            return {
                ...result,
                message: 'Данные команды успешно обновлены',
            };
        } catch (error) {
            throw error;
        }
    };

    public remove = async (slug: string, userId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new NotFoundException(`Команда ${slug} не найдена`);
        }

        const member = await this.teamsRepo.findMember(team.id, userId);

        const canEdit = team.ownerId === userId || member?.role === 'owner';

        if (!canEdit) {
            throw new ForbiddenException('У вас нет прав для выполнения этой команды');
        }

        try {
            const result = await this.teamsRepo.remove(team.id, userId);

            return {
                success: result,
                message: 'Данные команды успешно обновлены',
            };
        } catch (error) {
            throw error;
        }
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

    public getAllTags = async (query: FindTagsQuery) => {
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
    };

    public getAll = async (userId: string, pagination: Record<string, string>) => {
        const teams = await this.teamsRepo.findByUser(userId, pagination);
        return teams.map((t) => TeamMemberMapper.toUserTeam(t));
    };

    public getOne = async (slug: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new NotFoundException(`Команда ${slug} не найдена`);
        }
        return team;
    };
}
