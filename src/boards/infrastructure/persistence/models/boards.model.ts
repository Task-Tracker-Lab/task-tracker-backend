import { text, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { baseSchema, projects, users } from '@shared/entities';
import { createId } from '@paralleldrive/cuid2';

type KanbanSettings = {
    mock: boolean;
};

type CalendarSettings = {
    mock: boolean;
};

type MatrixSettings = {
    mock: boolean;
};

export const boardTypeEnum = baseSchema.enum('board_type', ['kanban', 'calendar', 'matrix']);

export const boards = baseSchema.table('boards', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => createId()),
    name: varchar('name', { length: 100 }).notNull(),
    type: boardTypeEnum('type').default('kanban').notNull(),
    projectId: text('project_id')
        .references(() => projects.id, { onDelete: 'cascade' })
        .notNull(),
    settings: jsonb('settings')
        .$type<KanbanSettings | CalendarSettings | MatrixSettings>()
        .notNull(),
    ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
