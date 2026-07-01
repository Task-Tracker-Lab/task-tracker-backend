import { CreateStateUseCase } from './create.use-case';
import { DeleteStateUseCase } from './delete.use-case';
import { GetStatesQuery } from './get-all.query';
import { GetStateQuery } from './get-one.query';
import { MoveStateUseCase } from './move.use-case';
import { ReorderStatesUseCase } from './reorder.use-case';
import { RestoreStateUseCase } from './restore.use-state';
import { UpdateStateUseCase } from './update.use-case';

export * from './create.use-case';
export * from './delete.use-case';
export * from './update.use-case';
export * from './get-one.query';
export * from './get-all.query';
export * from './restore.use-state';
export * from './update.use-case';
export * from './reorder.use-case';
export * from './move.use-case';

export const StatesUseCases = [
    CreateStateUseCase,
    RestoreStateUseCase,
    DeleteStateUseCase,
    UpdateStateUseCase,
    GetStateQuery,
    GetStatesQuery,
    ReorderStatesUseCase,
    MoveStateUseCase,
];
