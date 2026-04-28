import { createId } from '@paralleldrive/cuid2';
import { text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { baseSchema, users } from '@shared/entities';

export const sessions = baseSchema.table('sessions', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
    userId: text('user_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),
    deviceType: varchar('device_type', { length: 20 }).$type<'mobile' | 'desktop' | 'tablet'>(),
    browser: varchar('browser', { length: 50 }),
    os: varchar('os', { length: 50 }),
    userAgent: text('user_agent').notNull(),
    ip: varchar('ip', { length: 45 }).notNull(),
    city: varchar('city', { length: 100 }),
    countryCode: varchar('country_code', { length: 5 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    isRevoked: boolean('is_revoked').default(false).notNull(),
});
