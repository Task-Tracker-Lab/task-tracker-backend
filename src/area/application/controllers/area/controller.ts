import { Post, Body, Get, Query, Param, Delete, Put } from '@nestjs/common';
import { ApiBaseController, GetUserId } from '@shared/decorators';

import { AreaFacade } from '../../area.facade';
import { CreateAreaDto, UpdateAreaDto } from '../../dtos';

import {
    CreateAreaSwagger,
    DeleteAreaSwagger,
    FindAllAreasSwagger,
    FindOneAreaSwagger,
    UpdateAreaSwagger,
} from './swagger';

@ApiBaseController('projects/:slug/areas', 'Project Areas', true)
export class AreaController {
    constructor(private readonly facade: AreaFacade) {}

    @Post()
    @CreateAreaSwagger()
    async create(
        @Param('slug') slug: string,
        @Body() dto: CreateAreaDto,
        @GetUserId() userId: string,
    ) {
        return this.facade.createArea(slug, dto, userId);
    }

    @Get()
    @FindAllAreasSwagger()
    async findAll(
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Query('deleted') deleted?: string,
    ) {
        return this.facade.getAreas(slug, userId, deleted === 'true');
    }

    @Get(':key')
    @FindOneAreaSwagger()
    async findOne(
        @Param('slug') slug: string,
        @Param('key') key: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.getArea(slug, key, userId);
    }

    @Delete(':key')
    @DeleteAreaSwagger()
    async delete(
        @Param('slug') slug: string,
        @Param('key') key: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.deleteArea(slug, key, userId);
    }

    @Put(':key')
    @UpdateAreaSwagger()
    async updateArea(
        @Param('slug') slug: string,
        @Param('key') key: string,
        @Body() dto: UpdateAreaDto,
        @GetUserId('id') userId: string,
    ) {
        return this.facade.updateArea(slug, key, dto, userId);
    }
}
