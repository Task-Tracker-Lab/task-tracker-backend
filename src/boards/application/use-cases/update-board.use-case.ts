import { Inject, Injectable } from '@nestjs/common';
import { IBoardsRepository } from '@core/boards/domain/repository';

@Injectable()
export class UpdateBoardUseCase {
    constructor(
        @Inject('IBoardsRepository')
        private readonly boardsRepo: IBoardsRepository,
    ) {}

    public async execute(id: string, _projectId: string, _userId: string, dto: any) {
        return await this.boardsRepo.update(id, dto);
    }
}
