import { ApiBaseController } from '@shared/decorators';
import { ProjectsService } from '../services';
import { Get, Param } from '@nestjs/common';
import { GetProjectByTokenSwagger } from './projects.swagger';

@ApiBaseController('projects', 'Projects')
export class ProjectsController {
    constructor(private readonly facade: ProjectsService) {}

    @Get('share/:token')
    @GetProjectByTokenSwagger()
    async getByToken(@Param('token') token: string) {
        return this.facade.findByToken(token);
    }
}
