import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { FindTagsQuery } from '../dtos';

@Injectable()
export class TeamsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    public create = (userId: string, dto: any) => {
        return { userId, dto };
    };

    public update = (slug: string, dto: any) => {
        return { slug, dto };
    };

    public remove = (slug: string) => {
        return { slug };
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

    public getAll = (userId: string, pagination: Record<string, string>) => {
        return { userId, pagination };
    };

    public getOne = (slug: string) => {
        return { slug };
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

    public getMembers = (slug: string) => {
        return { slug };
    };

    public invite = (slug: string, userId: string, dto: any) => {
        return { slug, dto, userId };
    };

    public updateMember = (slug: string, userId: string, dto: any) => {
        return { slug, userId, dto };
    };

    public removeMember = (slug: string, userId: string) => {
        return { slug, userId };
    };
}
