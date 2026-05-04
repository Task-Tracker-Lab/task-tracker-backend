import { CreateBoardUseCase } from './create-board.use-case';
import { UpdateBoardUseCase } from './update-board.use-case';
import { DeleteBoardUseCase } from './delete-board.use-case';
import { GetBoardQuery } from './get-board.query';
import { GetBoardsQuery } from './get-boards.query';

export * from './create-board.use-case';
export * from './update-board.use-case';
export * from './delete-board.use-case';
export * from './get-board.query';
export * from './get-boards.query';

export const BoardUseCases = [CreateBoardUseCase, UpdateBoardUseCase, DeleteBoardUseCase];
export const BoardQueries = [GetBoardQuery, GetBoardsQuery];
