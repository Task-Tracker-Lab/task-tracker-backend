import type { NewState, State } from '../entities';

export interface IStateRepository {
    create(dto: NewState): Promise<{ readonly id: string }>;
    update(areaId: string, stateId: string, dto: Partial<State>): Promise<boolean>;
    delete(areaId: string, stateId: string): Promise<boolean>;
    findOne(areaId: string, stateId: string, deleted?: boolean): Promise<State | null>;
    find(areaId: string, query?: unknown): Promise<readonly State[]>;
    findByTitle(areaId: string, title: string): Promise<State | null>;
    findByType(
        areaId: string,
        type: 'custom' | 'archived' | 'backlog' | 'todo' | 'in_progress' | 'review' | 'done',
    ): Promise<State | null>;
    countByArea(areaId: string): Promise<number>;
    reorder(areaId: string): Promise<void>;
}
