import { Inject, Logger } from '@nestjs/common';
import { ITeamsRepository } from './teams.repository.interface';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import * as schema from '../entities';
import * as scUsers from 'src/modules/user/entities';
import { and, asc, count, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';

export class TeamsRepository implements ITeamsRepository {
    private logger = new Logger(TeamsRepository.name);

    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public isSlugAvailable = async (slug: string) => {
        const result = await this.db
            .select({ id: schema.teams.id })
            .from(schema.teams)
            .where(eq(schema.teams.slug, slug));

        return result.length === 0;
    };

    public addMember = async (dto: schema.NewTeamMember) => {
        const { rowCount } = await this.db
            .insert(schema.teamMembers)
            .values(dto)
            .onConflictDoNothing({
                target: [schema.teamMembers.teamId, schema.teamMembers.userId],
            });

        return (rowCount ?? 0) > 0;
    };

    public create = async (ownerId: string, dto: schema.NewTeam, tags?: string[]) => {
        return this.db.transaction(async (tx) => {
            const [{ teamId }] = await tx
                .insert(schema.teams)
                .values({ ...dto, ownerId })
                .returning({ teamId: schema.teams.id });

            let insertedTagsCount = 0;

            if (tags?.length) {
                const insertedTags = await tx
                    .insert(schema.tags)
                    .values(tags.map((name) => ({ name })))
                    .onConflictDoUpdate({
                        target: schema.tags.name,
                        set: { name: sql`${schema.tags.name}` },
                    })
                    .returning({ id: schema.tags.id });

                if (insertedTags.length > 0) {
                    await tx.insert(schema.teamsToTags).values(
                        insertedTags.map((tag) => ({
                            teamId,
                            tagId: tag.id,
                        })),
                    );

                    insertedTagsCount = insertedTags.length;
                }
            }

            await tx.insert(schema.teamMembers).values({
                teamId,
                userId: ownerId,
                role: 'owner',
                status: 'active',
                joinedAt: new Date(),
            });

            return {
                success: true,
                teamId,
                tags: insertedTagsCount,
            };
        });
    };

    public update = async (id: string, dto: Partial<schema.Team>, tags?: string[]) => {
        return this.db.transaction(async (tx) => {
            const [{ teamId }] = await tx
                .update(schema.teams)
                .set(dto)
                .where(eq(schema.teams.id, id))
                .returning({ teamId: schema.teams.id });

            if (tags?.length) {
            }

            return {
                success: true,
                teamId,
                tags: 0,
            };
        });
    };

    public remove = async (teamId: string, userId) => {
        const suffix = Date.now().toString();

        const { rowCount } = await this.db
            .update(schema.teams)
            .set({
                deletedAt: new Date(),
                slug: sql`${schema.teams.slug} || '-' || ${suffix}`,
            })
            .where(and(eq(schema.teams.id, teamId), eq(schema.teams.ownerId, userId)));

        return (rowCount ?? 0) > 0;
    };

    public findMember = async (teamId: string, userId: string) => {
        const [member] = await this.membersQuery.where(
            and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)),
        );

        return member || null;
    };

    public findMembers = async (teamId: string) => {
        return this.membersQuery
            .where(eq(schema.teamMembers.teamId, teamId))
            .orderBy(desc(schema.teamMembers.joinedAt));
    };

    public findByUser = async (
        userId: string,
        pagination: { search?: string; limit?: number; offset?: number },
    ) => {
        const { search, limit = 10, offset = 0 } = pagination;

        const filters = [
            eq(schema.teamMembers.userId, userId),
            eq(schema.teamMembers.status, 'active'),
            isNull(schema.teams.deletedAt),
        ];

        if (search) {
            filters.push(ilike(schema.teams.name, `%${search}%`));
        }

        const query = this.db
            .select({
                id: schema.teams.id,
                name: schema.teams.name,
                slug: schema.teams.slug,
                description: schema.teams.description,
                avatarUrl: schema.teams.avatarUrl,
                role: schema.teamMembers.role,
                joinedAt: schema.teamMembers.joinedAt,
            })
            .from(schema.teamMembers)
            .innerJoin(schema.teams, eq(schema.teams.id, schema.teamMembers.teamId))
            .where(and(...filters))
            .orderBy(desc(schema.teamMembers.joinedAt))
            .limit(limit)
            .offset(offset);

        return query;
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
        const [team] = await this.db.select().from(schema.teams).where(eq(schema.teams.slug, slug));
        if (!team) return null;
        return team;
    };

    public removeMember = async (teamId: string, userId: string) => {
        const result = await this.db
            .delete(schema.teamMembers)
            .where(
                and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)),
            );

        return (result.rowCount ?? 0) > 0;
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

    public updateMember = async (
        teamId: string,
        userId: string,
        dto: Partial<schema.TeamMember>,
    ) => {
        const { role, status } = dto;

        const data = {
            role,
            ...(status === 'active' ? { joinedAt: new Date() } : {}),
        };

        const result = await this.db
            .update(schema.teamMembers)
            .set(data)
            .where(
                and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)),
            );

        return (result.rowCount ?? 0) > 0;
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

    private get memberSelection() {
        return {
            userId: schema.teamMembers.userId,
            role: schema.teamMembers.role,
            status: schema.teamMembers.status,
            joinedAt: schema.teamMembers.joinedAt,
            firstName: scUsers.users.firstName,
            lastName: scUsers.users.lastName,
            middleName: scUsers.users.middleName,
            avatarUrl: scUsers.users.avatarUrl,
            email: scUsers.users.email,
        };
    }

    private get membersQuery() {
        return this.db
            .select(this.memberSelection)
            .from(schema.teamMembers)
            .innerJoin(scUsers.users, eq(schema.teamMembers.userId, scUsers.users.id));
    }
}
