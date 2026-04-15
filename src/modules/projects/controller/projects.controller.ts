import { ApiBaseController } from 'src/shared/decorators';
import { ProjectsService } from '../services';

@ApiBaseController('projects', 'Projects')
export class ProjectsController {
    constructor(private readonly facade: ProjectsService) {}
}
