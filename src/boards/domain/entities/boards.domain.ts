import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boards } from '@core/boards/infrastructure/persistence/models/boards.model';

export enum BoardType {
    Kanban = 'kanban',
    Calendar = 'calendar',
    Matrix = 'matrix',
}

export type Board = InferSelectModel<typeof boards>;
export type NewBoard = InferInsertModel<typeof boards>;
