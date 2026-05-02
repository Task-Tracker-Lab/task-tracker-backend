import { ApiBaseController } from '@shared/decorators';
import { BoardsFacade } from '@core/boards/application/boards.facade';

@ApiBaseController('boards', 'Boards', true)
export class BoardsController {
    constructor(private readonly facade: BoardsFacade) {}
}
