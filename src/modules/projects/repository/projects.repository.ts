import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { Injectable, Inject } from '@nestjs/common';
import * as schema from '../entities';
import { IProjectsRepository } from './projects.repository.interface';
import { and, eq, gt, isNull, or } from 'drizzle-orm';

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public create = async (data: schema.NewProject) => {
        const result = await this.db
            .insert(schema.projects)
            .values(data)
            .returning({ id: schema.projects.id });

        return { result: result.length > 0, id: result[0].id };
    };

    public update = async (id: string, data: Partial<schema.NewProject>) => {
        const result = await this.db
            .update(schema.projects)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(schema.projects.id, id))
            .returning({ id: schema.projects.id });

        return result.length > 0;
    };

    public delete = async (id: string) => {
        const result = await this.db
            .update(schema.projects)
            .set({ deletedAt: new Date() })
            .where(eq(schema.projects.id, id))
            .returning({ id: schema.projects.id });

        return result.length > 0;
    };

    public findOne = async (id: string) => {
        const [project] = await this.db
            .select()
            .from(schema.projects)
            .where(and(eq(schema.projects.id, id), isNull(schema.projects.deletedAt)));

        if (!project) return null;

        return project;
    };

    public findByTeam = async (teamId: string) => {
        return this.db
            .select()
            .from(schema.projects)
            .where(and(eq(schema.projects.teamId, teamId), isNull(schema.projects.deletedAt)));
    };

    public createShare = async (data: schema.NewProjectShare) => {
        const [result] = await this.db
            .insert(schema.projectShares)
            .values(data)
            .onConflictDoUpdate({
                target: schema.projectShares.token,
                set: {
                    expiresAt: data.expiresAt,
                    token: data.token,
                },
            })
            .returning({ id: schema.projectShares.id });

        return !!result;
    };

    public hasValidShareToken = async (id: string, token: string) => {
        const [result] = await this.db
            .select()
            .from(schema.projectShares)
            .where(
                and(
                    eq(schema.projectShares.projectId, id),
                    eq(schema.projectShares.token, token),
                    or(
                        isNull(schema.projectShares.expiresAt),
                        gt(schema.projectShares.expiresAt, new Date()),
                    ),
                ),
            )
            .limit(1);

        return !!result;
    };

    public revokeAllShares = async (projectId: string) => {
        const result = await this.db
            .delete(schema.projectShares)
            .where(eq(schema.projectShares.projectId, projectId))
            .returning({ id: schema.projectShares.id });

        return result.length > 0;
    };
}
