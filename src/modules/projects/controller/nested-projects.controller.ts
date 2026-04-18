import { ApiBaseController, GetUserId } from '@shared/decorators';
import { NestedProjectsService } from '../services/nested-projects.service';
import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
    ArchiveProjectSwagger,
    CreateProjectSwagger,
    FindAllProjectsSwagger,
    FindOneProjectSwagger,
    RemoveProjectSwagger,
    UpdateProjectSwagger,
} from './projects.swagger';

@ApiBaseController('teams/:slug/projects', 'Team Projects', true)
export class NestedProjectsController {
    constructor(private readonly facade: NestedProjectsService) {}

    @Get()
    @FindAllProjectsSwagger()
    async findAll(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.findByTeam(userId, slug);
    }

    @Get(':id')
    @FindOneProjectSwagger()
    async getOne(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.findOne(id, userId);
    }

    @Post(':id/share')
    @UpdateProjectSwagger()
    async generateShareToken(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.generateToken(id, userId);
    }

    @Post(':id/archive')
    @ArchiveProjectSwagger()
    async archive(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.setStatus(id, userId, 'archived');
    }

    @Post()
    @CreateProjectSwagger()
    async create(@Param('slug') slug: string, @GetUserId() userId: string, @Body() dto: any) {
        return this.facade.create(userId, slug, dto);
    }

    @Patch(':id')
    @UpdateProjectSwagger()
    async update(@Param('id') id: string, @GetUserId() userId: string, @Body() dto: any) {
        return this.facade.update(id, userId, dto);
    }

    @Delete(':id')
    @RemoveProjectSwagger()
    async remove(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.delete(id, userId);
    }
}
