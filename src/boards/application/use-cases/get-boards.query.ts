import { Inject, Injectable } from '@nestjs/common';
import { IBoardsRepository } from '@core/boards/domain/repository';

@Injectable()
export class GetBoardsQuery {
    constructor(
        @Inject('IBoardsRepository')
        private readonly boardsRepo: IBoardsRepository,
    ) {}

    public async execute(projectId: string, _userId: string) {
        return this.boardsRepo.findAll(projectId);
    }
}
