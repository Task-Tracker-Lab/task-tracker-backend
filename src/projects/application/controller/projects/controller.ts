import { ApiBaseController, GetUserId, Public } from '@shared/decorators';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
    ArchiveProjectSwagger,
    CreateProjectSwagger,
    CreateShareTokenSwagger,
    FindAllProjectsSwagger,
    FindOneProjectSwagger,
    RemoveProjectSwagger,
    UpdateProjectSwagger,
} from './swagger';
import { CreateProjectDto, CreateShareTokenDto, UpdateProjectDto } from '../../dtos';
import { ProjectStatus } from '@core/projects/domain/entities';
import { ProjectsFacade } from '../../projects.facade';

@ApiBaseController('teams/:slug/projects', 'Team Projects', true)
export class ProjectsController {
    constructor(private readonly facade: ProjectsFacade) {}

    @Get()
    @FindAllProjectsSwagger()
    async findAll(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.getTeamProjects(slug, userId);
    }

    @Get(':id')
    @Public()
    @FindOneProjectSwagger()
    async getOne(
        @Param('id') id: string,
        @Param('slug') slug: string,
        @GetUserId() userId?: string,
        @Query('token') token?: string,
    ) {
        return this.facade.getDetail(id, slug, userId, token);
    }

    @Post(':id/share')
    @CreateShareTokenSwagger()
    async generateShareToken(
        @Param('id') id: string,
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Body() dto: CreateShareTokenDto,
    ) {
        return this.facade.generateShareToken(id, slug, userId, dto);
    }

    @Post(':id/archive')
    @ArchiveProjectSwagger()
    async archive(
        @Param('id') id: string,
        @Param('slug') slug: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.setStatus(id, slug, userId, ProjectStatus.Archived);
    }

    @Post()
    @CreateProjectSwagger()
    async create(
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Body() dto: CreateProjectDto,
    ) {
        return this.facade.create(userId, slug, dto);
    }

    @Patch(':id')
    @UpdateProjectSwagger()
    async update(
        @Param('id') id: string,
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Body() dto: UpdateProjectDto,
    ) {
        return this.facade.update(id, slug, userId, dto);
    }

    @Delete(':id')
    @RemoveProjectSwagger()
    async remove(
        @Param('id') id: string,
        @Param('slug') slug: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.delete(id, slug, userId);
    }
}
