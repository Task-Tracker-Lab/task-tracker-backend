import { ApiBaseController, GetUserId } from '@shared/decorators';
import { ProjectsService } from '../services';
import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
    ArchiveProjectSwagger,
    FindOneProjectSwagger,
    GetProjectByTokenSwagger,
    RemoveProjectSwagger,
    UpdateProjectSwagger,
} from './projects.swagger';

@ApiBaseController('projects', 'Projects')
export class ProjectsController {
    constructor(private readonly facade: ProjectsService) {}

    @Get(':id')
    @FindOneProjectSwagger()
    async getOne(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.findOne(id, userId);
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

    @Post(':id/archive')
    @ArchiveProjectSwagger()
    async archive(@Param('id') id: string, @GetUserId() userId: string) {
        return this.facade.setStatus(id, userId, 'archived');
    }

    @Get('share/:token')
    @GetProjectByTokenSwagger()
    async getByToken(@Param('token') token: string) {
        return this.facade.findByToken(token);
    }
}
