import { ApiBaseController } from 'src/shared/decorators';
import { TeamsService } from '../services';

@ApiBaseController('teams', 'Teams')
export class TeamsController {
    constructor(private readonly facade: TeamsService) {}
}
