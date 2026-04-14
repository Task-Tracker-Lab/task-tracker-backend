import { primaryKey, timestamp, text, varchar, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { roleEnum, statusEnum } from './enums';
import { baseSchema, users } from 'src/shared/entities';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';

export const teams = baseSchema.table(
    'teams',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => createId()),
        slug: varchar('slug', { length: 120 }).unique().notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description'),
        avatarUrl: text('avatar_url'),
        coverUrl: text('cover_url'),
        ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
        deletedAt: timestamp('deleted_at'),
    },
    (t) => ({
        uniqueActiveSlug: uniqueIndex('team_active_slug_idx').on(t.slug).where(isNull(t.deletedAt)),
        slugIdx: index('team_slug_idx').on(t.slug),
        ownerIdx: index('team_owner_idx').on(t.ownerId),
        softDeleteIdx: index('team_deleted_at_idx').on(t.deletedAt),
    }),
);

export const teamMembers = baseSchema.table(
    'team_members',
    {
        teamId: text('team_id')
            .references(() => teams.id, { onDelete: 'cascade' })
            .notNull(),
        userId: text('user_id')
            .references(() => users.id, { onDelete: 'cascade' })
            .notNull(),
        role: roleEnum('role').default('member').notNull(),
        status: statusEnum('status').default('inactive').notNull(),
        joinedAt: timestamp('joined_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.teamId, t.userId] }),
        statusIdx: index('member_status_idx').on(t.status),
        userRoleIdx: index('member_role_idx').on(t.userId, t.role),
    }),
);

export const tags = baseSchema.table('tags', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
    name: varchar('name', { length: 50 }).unique().notNull(),
});

export const teamsToTags = baseSchema.table(
    'teams_to_tags',
    {
        teamId: text('team_id')
            .references(() => teams.id, { onDelete: 'cascade' })
            .notNull(),
        tagId: text('tag_id')
            .references(() => tags.id, { onDelete: 'cascade' })
            .notNull(),
    },
    (t) => ({
        pk: primaryKey({ columns: [t.teamId, t.tagId] }),
        tagIdx: index('teams_to_tags_tag_id_idx').on(t.tagId),
    }),
);
