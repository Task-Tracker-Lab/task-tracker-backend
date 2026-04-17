import {
    text,
    varchar,
    boolean,
    timestamp,
    jsonb,
    integer,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';
import { baseSchema, teams, users } from '@shared/entities';
import { createId } from '@paralleldrive/cuid2';
import { isNull } from 'drizzle-orm';
import { projectStatusEnum, projectVisibilityEnum } from './enums';

export const projects = baseSchema.table(
    'projects',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => createId()),
        teamId: text('team_id')
            .references(() => teams.id, { onDelete: 'cascade' })
            .notNull(),
        key: varchar('key', { length: 10 }).notNull(),
        name: varchar('name', { length: 100 }).notNull(),
        description: text('description'),
        icon: varchar('icon', { length: 255 }),
        color: varchar('color', { length: 7 }),
        status: projectStatusEnum('status').default('active').notNull(),
        taskSequence: integer('task_sequence').default(0).notNull(),
        ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
        visibility: projectVisibilityEnum('visibility').default('public').notNull(),
        isPubliclyViewable: boolean('is_publicly_viewable').default(false).notNull(),
        shareToken: varchar('share_token', { length: 64 }).unique(),
        settings: jsonb('settings').default({}),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
        deletedAt: timestamp('deleted_at'),
    },
    (t) => ({
        uniqueTeamKey: uniqueIndex('project_team_key_idx')
            .on(t.teamId, t.key)
            .where(isNull(t.deletedAt)),
        ownerIdx: index('project_owner_id_idx').on(t.ownerId),
        teamIdx: index('project_team_id_idx').on(t.teamId),
        shareTokenIdx: index('project_share_token_idx').on(t.shareToken),
    }),
);
