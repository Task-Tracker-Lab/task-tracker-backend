import { Injectable } from '@nestjs/common';
import { IBoardsRepository } from '../../../domain/repository';
import { Board, NewBoard } from '@core/boards/domain/entities';

@Injectable()
export class BoardsRepository implements IBoardsRepository {
    async findAll(_projectId: string): Promise<Board[]> {
        return [
            {
                id: '1',
                name: 'mockBoard1',
                projectId: 'projectId-1',
                settings: {
                    mock: true,
                },
                ownerId: 'userId-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                type: 'kanban',
            },
            {
                id: '2',
                name: 'mockBoard2',
                projectId: 'projectId-2',
                settings: {
                    mock: true,
                },
                ownerId: 'userId-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                type: 'kanban',
            },
        ];
    }

    async findById(_id: string): Promise<Board | undefined> {
        return {
            id: '1',
            name: 'mockBoard1',
            projectId: 'projectId-1',
            settings: {
                mock: true,
            },
            ownerId: 'userId-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'kanban',
        };
    }

    async create(_data: NewBoard): Promise<Board> {
        return {
            id: '1',
            name: 'mockBoard1',
            projectId: 'projectId-1',
            settings: {
                mock: true,
            },
            ownerId: 'userId-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'kanban',
        };
    }

    async update(_id: string, _data: Partial<Board>): Promise<Board | undefined> {
        return {
            id: '1',
            name: 'mockBoard1',
            projectId: 'projectId-1',
            settings: {
                mock: true,
            },
            ownerId: 'userId-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'kanban',
        };
    }

    async remove(_id: string): Promise<boolean> {
        return true;
    }
}
