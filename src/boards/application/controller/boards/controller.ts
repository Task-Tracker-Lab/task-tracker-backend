import { ApiBaseController, GetUserId } from '@shared/decorators';
import { BoardsFacade } from '@core/boards/application/boards.facade';
import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';

@ApiBaseController('projects/:projectId/boards', 'Boards', true)
export class BoardsController {
    constructor(private readonly facade: BoardsFacade) {}

    @Get()
    async findAll(@Param('projectId') projectId: string, @GetUserId() userId: string) {
        return this.facade.getAll(projectId, userId);
    }

    @Get(':id')
    async findOne(
        @Param('id') id: string,
        @Param('projectId') projectId: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.getOne(id, projectId, userId);
    }

    @Post()
    async create(
        @Param('projectId') projectId: string,
        @GetUserId() userId: string,
        @Body() dto: any,
    ) {
        return this.facade.create(projectId, userId, dto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Param('projectId') projectId: string,
        @GetUserId() userId: string,
        @Body() dto: any,
    ) {
        return this.facade.update(id, projectId, userId, dto);
    }

    @Delete(':id')
    async remove(
        @Param('id') id: string,
        @Param('projectId') projectId: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.delete(id, projectId, userId);
    }
}
