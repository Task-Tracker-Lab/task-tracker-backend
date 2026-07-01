import { IUserRepository } from '@core/user/domain/repository';
import { DATABASE_SERVICE, DatabaseService, paginateCursor } from '@libs/database';
import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { CursorQuery } from '@shared/schemas';
import { eq, inArray, sql } from 'drizzle-orm';

import * as sc from '../models';

import type { UserActivity } from '../../../domain/entities/user.domain';
import type {
    NewUser,
    NewUserActivity,
    User,
    UserNotifications,
    UserPreferences,
} from '@core/user/domain/entities';

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

    public findProfile = async (id: string) => {
        const [rows] = await this.fullUserQuery
            .leftJoin(sc.userPreferences, eq(sc.users.id, sc.userPreferences.userId))
            .where(eq(sc.users.id, id));

        if (!rows || !rows.users || !rows.user_security) {
            throw new Error(`User with id ${id} not found`);
        }

        const { lastPasswordChange, is2faEnabled } = rows.user_security;

        const defaultNotifications = {
            email: {
                task_assigned: true,
                mentions: true,
                daily_summary: false,
            },
            push: {
                task_assigned: true,
                reminders: true,
            },
        };

        return {
            user: rows.users,
            security: {
                lastPasswordChange: lastPasswordChange ?? null,
                is2faEnabled: is2faEnabled ?? false,
            },
            preferences: rows.user_preferences ?? null,
            notifications: rows.user_notifications?.settings ?? defaultNotifications,
        };
    };

    public findByIds = async (ids: string[]) => {
        if (ids.length === 0) {
            return [];
        }

        return this.db.select().from(sc.users).where(inArray(sc.users.id, ids));
    };

    public findById = async (id: string) => {
        const [row] = await this.fullUserQuery.where(eq(sc.users.id, id));
        if (!row || !row.user_security) {
            return null;
        }
        return {
            user: row.users,
            security: {
                passwordHash: row.user_security.passwordHash,
            },
        };
    };

    public findByEmail = async (email: string) => {
        const [row] = await this.fullUserQuery.where(eq(sc.users.email, email.toLowerCase()));
        if (!row || !row.user_security) {
            return null;
        }
        return {
            user: row.users,
            security: {
                passwordHash: row.user_security.passwordHash,
            },
        };
    };

    public findSecurityByUserId = async (userId: string) => {
        const [result] = await this.db
            .select()
            .from(sc.userSecurity)
            .where(eq(sc.userSecurity.userId, userId));
        return result || null;
    };

    public create = async (data: NewUser) =>
        this.db.transaction(async (tx) => {
            const [newUser] = await tx.insert(sc.users).values(data).returning();

            if (!newUser) {
                throw new Error('Failed to create user');
            }

            await tx.insert(sc.userSecurity).values({
                userId: newUser.id,
                is2faEnabled: false,
                lastLoginAt: new Date().toISOString(),
                passwordHash: null,
            });

            await tx.insert(sc.userNotifications).values({
                userId: newUser.id,
            });

            return newUser;
        });

    public updateProfile = async (
        id: string,
        user: Partial<User>,
        preferences?: Partial<UserPreferences>,
    ) => {
        const results = await Promise.all([
            this.updateUser(id, user),
            this.upsertPreferences(id, preferences),
        ]);

        return results.some((result) => result === true);
    };

    private async updateUser(id: string, data: Partial<User>) {
        if (Object.keys(data).length === 0) {
            return null;
        }

        const result = await this.db
            .update(sc.users)
            .set({ ...data, updatedAt: new Date().toISOString() })
            .where(eq(sc.users.id, id));

        return (result?.count ?? 0) > 0;
    }

    private async upsertPreferences(userId: string, data?: Partial<UserPreferences>) {
        if (!data || Object.keys(data).length === 0) {
            return false;
        }

        const existing = await this.db
            .select({ id: sc.userPreferences.userId })
            .from(sc.userPreferences)
            .where(eq(sc.userPreferences.userId, userId))
            .limit(1);

        if (existing.length === 0) {
            const result = await this.db.insert(sc.userPreferences).values({
                userId,
                ...data,
            });

            return (result.count ?? 0) > 0;
        } else {
            const result = await this.db
                .update(sc.userPreferences)
                .set(data)
                .where(eq(sc.userPreferences.userId, userId));

            return (result.count ?? 0) > 0;
        }
    }

    public updateNotifications = async (id: string, settings: UserNotifications['settings']) => {
        const result = await this.db
            .update(sc.userNotifications)
            .set({
                settings: sql`${sc.userNotifications.settings} || ${JSON.stringify(settings)}::jsonb`,
            })
            .where(eq(sc.userNotifications.userId, id));
        return (result?.count ?? 0) > 0;
    };

    public updateAvatar = async (id: string, url: string) => {
        const result = await this.db
            .update(sc.users)
            .set({ avatarUrl: url, updatedAt: new Date().toISOString() })
            .where(eq(sc.users.id, id));
        return (result?.count ?? 0) > 0;
    };

    public updatePasswordHash = async (id: string, hash: string) => {
        const result = await this.db
            .insert(sc.userSecurity)
            .values({ userId: id, passwordHash: hash })
            .onConflictDoUpdate({
                target: sc.userSecurity.userId,
                set: { passwordHash: hash, lastPasswordChange: new Date().toISOString() },
            });
        return (result?.count ?? 0) > 0;
    };

    public logActivity = async (data: NewUserActivity) => {
        const result = await this.db.insert(sc.userActivity).values({
            ...data,
            id: data.id ?? createId(),
        });
        return (result?.count ?? 0) > 0;
    };

    public findActivityByUser = async (userId: string, query: CursorQuery) => {
        const q = this.db
            .select()
            .from(sc.userActivity)
            .where(eq(sc.userActivity.userId, userId))
            .$dynamic();

        return paginateCursor<UserActivity>(q, {
            column: sc.userActivity.id,
            ...query,
            sort: { column: sc.userActivity.id, order: 'desc' },
        });
    };
}
