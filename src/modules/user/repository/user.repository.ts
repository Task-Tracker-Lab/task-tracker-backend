import * as sc from '../entities';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { IUserRepository } from './user.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { NewUser, NewUserActivity, User, UserNotifications } from '../entities/user.domain';
import { createId } from '@paralleldrive/cuid2';
import { desc, eq, count } from 'drizzle-orm';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly repository: DatabaseService<typeof sc>,
    ) {}

    async findProfile(id: string) {
        const rows = await this.repository
            .select()
            .from(sc.users)
            .leftJoin(sc.userSecurity, eq(sc.users.id, sc.userSecurity.userId))
            .leftJoin(sc.userNotifications, eq(sc.users.id, sc.userNotifications.userId))
            .where(eq(sc.users.id, id))
            .limit(1);

        if (rows.length === 0) return null;

        const { users: user, user_security: security, user_notifications: notifications } = rows[0];

        return {
            ...user,
            security: {
                is2faEnabled: security?.is2faEnabled ?? false,
                lastPasswordChange: security?.lastPasswordChange ?? user.createdAt,
            },
            notifications: notifications?.settings ?? {
                email: { task_assigned: true, mentions: true, daily_summary: false },
                push: { task_assigned: true, reminders: true },
            },
        };
    }

    async findById(id: string): Promise<User | null> {
        const [result] = await this.repository
            .select()
            .from(sc.users)
            .where(eq(sc.users.id, id))
            .limit(1);
        return result || null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const [result] = await this.repository
            .select()
            .from(sc.users)
            .where(eq(sc.users.email, email))
            .limit(1);
        return result || null;
    }

    async findSecurityByUserId(userId: string) {
        const [result] = await this.repository
            .select()
            .from(sc.userSecurity)
            .where(eq(sc.userSecurity.userId, userId))
            .limit(1);
        return result || null;
    }

    async create(data: NewUser): Promise<User> {
        return await this.repository.transaction(async (tx) => {
            const [newUser] = await tx.insert(sc.users).values(data).returning();

            await tx.insert(sc.userNotifications).values({
                userId: newUser.id,
            });

            return newUser;
        });
    }

    async existsByEmail(email: string): Promise<boolean> {
        const [result] = await this.repository
            .select({ value: count() })
            .from(sc.users)
            .where(eq(sc.users.email, email));
        return (result?.value ?? 0) > 0;
    }

    async updateProfile(id: string, data: Partial<User>): Promise<User> {
        const [updated] = await this.repository
            .update(sc.users)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(sc.users.id, id))
            .returning();
        return updated;
    }

    async updateNotifications(id: string, settings: UserNotifications['settings']) {
        await this.repository
            .update(sc.userNotifications)
            .set({ settings })
            .where(eq(sc.userNotifications.userId, id));
    }

    async updateAvatar(id: string, url: string) {
        await this.repository
            .update(sc.users)
            .set({ avatarUrl: url, updatedAt: new Date() })
            .where(eq(sc.users.id, id));
    }

    async updatePasswordHash(id: string, hash: string) {
        await this.repository
            .insert(sc.userSecurity)
            .values({ userId: id, passwordHash: hash })
            .onConflictDoUpdate({
                target: sc.userSecurity.userId,
                set: { passwordHash: hash, lastPasswordChange: new Date() },
            });
    }

    async logActivity(data: NewUserActivity) {
        await this.repository.insert(sc.userActivity).values({
            ...data,
            id: data.id ?? createId(),
        });
    }

    async findActivityByUser(userId: string, options: { limit: number; offset: number }) {
        const [totalResult, items] = await Promise.all([
            this.repository
                .select({ value: count() })
                .from(sc.userActivity)
                .where(eq(sc.userActivity.userId, userId)),
            this.repository
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
