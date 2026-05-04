import { Injectable } from '@nestjs/common';
import {
    CreateBoardUseCase,
    DeleteBoardUseCase,
    GetBoardQuery,
    GetBoardsQuery,
    UpdateBoardUseCase,
} from './use-cases';

@Injectable()
export class BoardsFacade {
    constructor(
        private readonly createBoardUC: CreateBoardUseCase,
        private readonly updateBoardUC: UpdateBoardUseCase,
        private readonly deleteBoardUC: DeleteBoardUseCase,
        private readonly getBoardQ: GetBoardQuery,
        private readonly getBoardsQ: GetBoardsQuery,
    ) {}

    public async create(projectId: string, userId: string, dto: any) {
        return this.createBoardUC.execute(projectId, userId, dto);
    }

    public async update(id: string, projectId: string, userId: string, dto: any) {
        return this.updateBoardUC.execute(id, projectId, userId, dto);
    }

    public async delete(id: string, projectId: string, userId: string) {
        return this.deleteBoardUC.execute(id, projectId, userId);
    }

    public async getOne(id: string, projectId: string, userId: string) {
        return this.getBoardQ.execute(id, projectId, userId);
    }

    public async getAll(projectId: string, userId: string) {
        return this.getBoardsQ.execute(projectId, userId);
    }
}
