import * as sc from '../entities';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { IUserRepository } from './user.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import type { NewUser, NewUserActivity, User, UserNotifications } from '../entities/user.domain';
import { createId } from '@paralleldrive/cuid2';
import { desc, eq, count } from 'drizzle-orm';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof sc>,
    ) {}

    private get fullUserQuery() {
        return this.db
            .select()
            .from(sc.users)
            .leftJoin(sc.userSecurity, eq(sc.users.id, sc.userSecurity.userId))
            .leftJoin(sc.userNotifications, eq(sc.users.id, sc.userNotifications.userId));
    }

    async findProfile(id: string) {
        const [rows] = await this.fullUserQuery.where(eq(sc.users.id, id));
        if (!rows.users) return null;
        const { lastPasswordChange, is2faEnabled } = rows.user_security;
        const { settings } = rows.user_notifications;

        return {
            user: rows.users,
            security: { lastPasswordChange, is2faEnabled },
            notifications: settings,
        };
    }

    async findById(id: string) {
        const [row] = await this.fullUserQuery.where(eq(sc.users.id, id));
        if (!row || !row.user_security) return null;
        return {
            user: row.users,
            security: {
                passwordHash: row.user_security.passwordHash,
            },
        };
    }

    async findByEmail(email: string) {
        const [row] = await this.fullUserQuery.where(eq(sc.users.email, email.toLowerCase()));
        if (!row || !row.user_security) return null;
        return {
            user: row.users,
            security: {
                passwordHash: row.user_security.passwordHash,
            },
        };
    }

    async findSecurityByUserId(userId: string) {
        const [result] = await this.db
            .select()
            .from(sc.userSecurity)
            .where(eq(sc.userSecurity.userId, userId));
        return result || null;
    }

    async create(data: NewUser) {
        return await this.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(sc.users).values(data).returning();

            await tx.insert(sc.userNotifications).values({
                userId: newUser.id,
            });

            return newUser;
        });
    }

    async updateProfile(id: string, data: Partial<User>) {
        const { rowCount } = await this.db
            .update(sc.users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(sc.users.id, id));
        return (rowCount ?? 0) > 0;
    }

    async updateNotifications(id: string, settings: UserNotifications['settings']) {
        const { rowCount } = await this.db
            .update(sc.userNotifications)
            .set({ settings })
            .where(eq(sc.userNotifications.userId, id));
        return (rowCount ?? 0) > 0;
    }

    async updateAvatar(id: string, url: string) {
        const { rowCount } = await this.db
            .update(sc.users)
            .set({ avatarUrl: url, updatedAt: new Date() })
            .where(eq(sc.users.id, id));
        return (rowCount ?? 0) > 0;
    }

    async updatePasswordHash(id: string, hash: string) {
        const { rowCount } = await this.db
            .insert(sc.userSecurity)
            .values({ userId: id, passwordHash: hash })
            .onConflictDoUpdate({
                target: sc.userSecurity.userId,
                set: { passwordHash: hash, lastPasswordChange: new Date() },
            });
        return (rowCount ?? 0) > 0;
    }

    async logActivity(data: NewUserActivity) {
        const { rowCount } = await this.db.insert(sc.userActivity).values({
            ...data,
            id: data.id ?? createId(),
        });
        return (rowCount ?? 0) > 0;
    }

    async findActivityByUser(userId: string, options: { limit: number; offset: number }) {
        const [totalResult, items] = await Promise.all([
            this.db
                .select({ value: count() })
                .from(sc.userActivity)
                .where(eq(sc.userActivity.userId, userId)),
            this.db
                .select()
                .from(sc.userActivity)
                .where(eq(sc.userActivity.userId, userId))
                .limit(options.limit)
                .offset(options.offset)
                .orderBy(desc(sc.userActivity.createdAt)),
        ]);

        return {
            items,
            total: Number(totalResult[0]?.value ?? 0),
        };
    }
}
