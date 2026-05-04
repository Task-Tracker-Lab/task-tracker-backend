import { Inject, Injectable } from '@nestjs/common';
import { IBoardsRepository } from '@core/boards/domain/repository';

@Injectable()
export class CreateBoardUseCase {
    constructor(
        @Inject('IBoardsRepository')
        private readonly boardsRepo: IBoardsRepository,
    ) {}

    public async execute(_projectId: string, _userId: string, dto: any) {
        return this.boardsRepo.create(dto);
    }
}
