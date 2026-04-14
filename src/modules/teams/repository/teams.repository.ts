import { Inject, Logger } from '@nestjs/common';
import { ITeamsRepository } from './teams.repository.interface';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import * as schema from '../entities';
import { asc, count, eq, ilike, inArray } from 'drizzle-orm';

export class TeamsRepository implements ITeamsRepository {
    private logger = new Logger(TeamsRepository.name);

    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public addMember = async (dto: schema.NewTeamMember) => {
        this.logger.log(dto);
        return null;
    };

    public create = async (ownerId: string, dto: schema.NewTeam) => {
        this.logger.log(ownerId, dto);
        return null;
    };

    public findAll = async (
        userId: string,
        pagination: { search?: string; limit?: number; offset?: number },
    ) => {
        this.logger.log(userId, pagination);
        return [];
    };

    public findAllTags = async (options: { search?: string; limit?: number; offset?: number }) => {
        const cleanSearch = options.search?.trim();
        const escapedSearch = cleanSearch?.replace(/([%_\\])/g, '\\$1');

        const whereCondition = escapedSearch
            ? ilike(schema.tags.name, `%${escapedSearch}%`)
            : undefined;

        const [data, [{ total }]] = await Promise.all([
            this.db
                .select()
                .from(schema.tags)
                .where(whereCondition)
                .limit(options.limit)
                .offset(options.offset)
                .orderBy(asc(schema.tags.name)),

            this.db.select({ total: count() }).from(schema.tags).where(whereCondition),
        ]);

        return {
            data,
            total: Number(total ?? 0),
        };
    };

    public findBySlug = async (slug: string) => {
        this.logger.log(slug);
        return null;
    };

    public remove = async (id: string) => {
        this.logger.log(id);
        return Promise.resolve(true);
    };

    public removeMember = async (teamId: string, userId: string) => {
        this.logger.log(teamId, userId);
        return Promise.resolve(true);
    };

    public syncTags = async (teamId: string, tagNames: string[]) => {
        await this.db.transaction(async (tx) => {
            await tx.delete(schema.teamsToTags).where(eq(schema.teamsToTags.teamId, teamId));

            if (tagNames.length === 0) {
                return;
            }

            await tx
                .insert(schema.tags)
                .values(tagNames.map((name) => ({ name })))
                .onConflictDoNothing({ target: schema.tags.name });

            const existingTags = await tx
                .select({ id: schema.tags.id })
                .from(schema.tags)
                .where(inArray(schema.tags.name, tagNames));

            await tx
                .insert(schema.teamsToTags)
                .values(existingTags.map((tag) => ({ teamId, tagId: tag.id })));
        });

        return true;
    };

    public update = async (id: string, dto: Partial<schema.Team>) => {
        this.logger.log(id, dto);
        return Promise.resolve(true);
    };

    public updateMember = async (
        teamId: string,
        userId: string,
        dto: Partial<schema.TeamMember>,
    ) => {
        this.logger.log(teamId, userId, dto);
        return Promise.resolve(true);
    };

    public async updateTeamAvatar(teamId: string, url: string): Promise<boolean> {
        const { rowCount } = await this.db
            .update(schema.teams)
            .set({ avatarUrl: url, updatedAt: new Date() })
            .where(eq(schema.teams.id, teamId));
        return (rowCount ?? 0) > 0;
    }

    public async updateTeamBanner(teamId: string, url: string): Promise<boolean> {
        const { rowCount } = await this.db
            .update(schema.teams)
            .set({ coverUrl: url, updatedAt: new Date() })
            .where(eq(schema.teams.id, teamId));
        return (rowCount ?? 0) > 0;
    }
}
