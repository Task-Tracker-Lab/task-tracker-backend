import { Module } from '@nestjs/common';
import { BoardsRepository } from './infrastructure/persistence/repositories';
import { BoardsController } from './application/controller';
import { BoardsFacade } from './application/boards.facade';
import { BoardQueries, BoardUseCases } from './application/use-cases';

const REPOSITORY = {
    provide: 'IBoardsRepository',
    useClass: BoardsRepository,
};

@Module({
    controllers: [BoardsController],
    providers: [REPOSITORY, BoardsFacade, ...BoardUseCases, ...BoardQueries],
})
export class BoardsModule {}
