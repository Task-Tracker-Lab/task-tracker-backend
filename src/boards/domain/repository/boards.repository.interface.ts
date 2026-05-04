import { Board, NewBoard } from '@core/boards/domain/entities';

export interface IBoardsRepository {
    findAll(projectId: string): Promise<Board[]>;
    findById(id: string): Promise<Board | null>;
    create(data: NewBoard): Promise<Board>;
    update(id: string, data: Partial<Board>): Promise<Board>;
    remove(id: string): Promise<boolean>;
}
