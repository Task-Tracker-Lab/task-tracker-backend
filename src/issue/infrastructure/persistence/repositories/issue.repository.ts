import * as scUsers from '@core/user/infrastructure/persistence/models';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { Inject } from '@nestjs/common';
import { aliasedTable, and, eq, getTableColumns, isNull, sql, type SQL } from 'drizzle-orm';

import { IssueQueryDto } from '../../../application/dtos';
import * as schema from '../models/issue.model';

import type { IIssueRepository } from '../../../domain/repositories';

export class IssueRepository implements IIssueRepository {
    private readonly assigneeUsers = aliasedTable(scUsers.users, 'assignee_users');
    private readonly reporterUsers = aliasedTable(scUsers.users, 'reporter_users');
    private readonly parentIssues = aliasedTable(schema.issues, 'parent_issues');

    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public async create(data: typeof schema.issues.$inferInsert, userId: string) {
        const [result] = await this.db
            .insert(schema.issues)
            .values({ ...data, reporterId: userId })
            .returning({ id: schema.issues.id });

        if (!result) {
            throw new Error('Failed to create issue: no issue returned');
        }

        return result;
    }

    public async delete(id: string, _userId: string) {
        const result = await this.db
            .update(schema.issues)
            .set({
                deletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            .where(and(eq(schema.issues.id, id), isNull(schema.issues.deletedAt)));

        return (result.count ?? 0) > 0;
    }

    public async find(_query: IssueQueryDto) {
        const conditions: SQL[] = [isNull(schema.issues.deletedAt)];

        return this.baseIssueQuery.where(and(...conditions));
    }

    public async findOne(id: string, _userId: string) {
        const [result] = await this.baseIssueQuery.where(
            and(eq(schema.issues.id, id), isNull(schema.issues.deletedAt)),
        );

        return result ?? null;
    }

    public async restore(id: string, _userId: string) {
        const result = await this.db
            .update(schema.issues)
            .set({
                deletedAt: null,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.issues.id, id));

        return (result.count ?? 0) > 0;
    }

    public async update(id: string, data: Partial<typeof schema.issues.$inferInsert>) {
        const result = await this.db
            .update(schema.issues)
            .set(data)
            .where(and(eq(schema.issues.id, id), isNull(schema.issues.deletedAt)))
            .returning({ id: schema.issues.id });

        if (!result) {
            throw new Error('Failed to update issue: no issue returned');
        }

        return result.length > 0;
    }

    public async reorder(stateId: string) {
        const currentIssues = await this.db
            .select({ id: schema.issues.id })
            .from(schema.issues)
            .where(eq(schema.issues.stateId, stateId))
            .orderBy(schema.issues.position);

        if (currentIssues.length === 0) {
            return;
        }

        const STEP = 100.0;
        const sqlChunks: string[] = [];

        currentIssues.forEach((issue, index) => {
            const newPos = (index + 1) * STEP;
            sqlChunks.push(`WHEN id = '${issue.id}' THEN ${newPos}::double precision`);
        });

        await this.db.execute(sql`
              UPDATE ${schema.issues}
              SET position = CASE ${sql.raw(sqlChunks.join(' '))} END
              WHERE state_id = ${stateId}
            `);
    }

    private get baseIssueQuery() {
        return this.db
            .select(this.issueSelection)
            .from(schema.issues)
            .leftJoin(this.parentIssues, eq(schema.issues.parentId, this.parentIssues.id))
            .leftJoin(this.assigneeUsers, eq(schema.issues.assigneeId, this.assigneeUsers.id))
            .leftJoin(this.reporterUsers, eq(schema.issues.reporterId, this.reporterUsers.id));
    }

    private get issueSelection() {
        const { assigneeId, reporterId, parentId, ...issuesColumns } = getTableColumns(
            schema.issues,
        );

        return {
            ...issuesColumns,
            parent: {
                id: schema.issues.parentId,
                title: this.parentIssues.title,
            },
            assignee: this.getUserSelection(this.assigneeUsers),
            reporter: this.getUserSelection(this.reporterUsers),
        };
    }

    private getUserSelection(table: typeof scUsers.users) {
        return {
            id: table.id,
            name: sql<string>`concat(${table.firstName}, ' ', ${table.lastName})`,
            avatarUrl: table.avatarUrl,
            email: table.email,
        };
    }
}
