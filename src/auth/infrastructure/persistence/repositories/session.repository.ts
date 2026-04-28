import { Inject, Injectable } from '@nestjs/common';
import { eq, and, ne, lt, desc } from 'drizzle-orm';
import * as schema from '../models';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { ISessionRepository, type SessionInsert } from '../../../domain/repository';

@Injectable()
export class SessionRepository implements ISessionRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    async create(data: SessionInsert) {
        const [result] = await this.db.insert(schema.sessions).values(data).returning();
        return result;
    }

    async findById(id: string) {
        const [result] = await this.db
            .select()
            .from(schema.sessions)
            .where(and(eq(schema.sessions.id, id), eq(schema.sessions.isRevoked, false)))
            .limit(1);

        return result || null;
    }

    async findAllByUserId(userId: string) {
        return this.db
            .select()
            .from(schema.sessions)
            .where(and(eq(schema.sessions.userId, userId), eq(schema.sessions.isRevoked, false)))
            .orderBy(desc(schema.sessions.createdAt));
    }

    async revoke(id: string) {
        const { rowCount } = await this.db
            .update(schema.sessions)
            .set({ isRevoked: true, updatedAt: new Date() })
            .where(eq(schema.sessions.id, id));

        return (rowCount ?? 0) > 0;
    }

    async revokeAllByUserId(userId: string, exceptSessionId?: string) {
        const filters = [eq(schema.sessions.userId, userId)];

        if (exceptSessionId) {
            filters.push(ne(schema.sessions.id, exceptSessionId));
        }

        await this.db
            .update(schema.sessions)
            .set({ isRevoked: true, updatedAt: new Date() })
            .where(and(...filters));
    }

    async deleteExpired() {
        const result = await this.db
            .delete(schema.sessions)
            .where(lt(schema.sessions.expiresAt, new Date()));

        return result.rowCount;
    }
}
