import { createId } from '@paralleldrive/cuid2';
import { varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { baseSchema } from '@shared/entities';

export const users = baseSchema.table('users', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),

    firstName: varchar('first_name', { length: 50 }).notNull(),
    lastName: varchar('last_name', { length: 50 }).notNull(),
    middleName: varchar('middle_name', { length: 50 }),

    email: varchar('email', { length: 255 }).notNull().unique(),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
    language: varchar('language', { length: 5 }).default('ru').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userSecurity = baseSchema.table('user_security', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    is2faEnabled: boolean('is_2fa_enabled').default(false).notNull(),
    twoFactorSecret: text('two_factor_secret'),
    lastPasswordChange: timestamp('last_password_change', { withTimezone: true })
        .defaultNow()
        .notNull(),
});

export const userNotifications = baseSchema.table('user_notifications', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    settings: jsonb('settings')
        .$type<{
            email: { task_assigned: boolean; mentions: boolean; daily_summary: boolean };
            push: { task_assigned: boolean; reminders: boolean };
        }>()
        .default({
            email: { task_assigned: true, mentions: true, daily_summary: false },
            push: { task_assigned: true, reminders: true },
        })
        .notNull(),
});

export const userActivity = baseSchema.table('user_activity', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    entityId: varchar('entity_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
