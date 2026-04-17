import { ApiBaseController, GetUserId } from '@shared/decorators';
import { ProjectsService } from '../services';
import { Body, Get, Param, Post } from '@nestjs/common';
import { CreateProjectSwagger, FindAllProjectsSwagger } from './projects.swagger';

@ApiBaseController('teams/:slug/projects', 'Team Projects')
export class NestedProjectsController {
    constructor(private readonly facade: ProjectsService) {}

    @Get()
    @FindAllProjectsSwagger()
    async findAll(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.findByTeam(userId, slug);
    }

    @Post()
    @CreateProjectSwagger()
    async create(@Param('slug') slug: string, @GetUserId() userId: string, @Body() dto: any) {
        return this.facade.create(userId, slug, dto);
    }
}
