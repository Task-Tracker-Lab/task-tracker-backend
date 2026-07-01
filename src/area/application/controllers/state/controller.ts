import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBaseController, GetUserId, Public } from '@shared/decorators';

import { AreaFacade } from '../../area.facade';
import { CreateStateDto, MoveStateDto, QueryParamsDto, UpdateStateDto } from '../../dtos';

import {
    CreateStateSwagger,
    FindAllStatesSwagger,
    FindOneStateSwagger,
    MoveStateSwagger,
    RemoveStateSwagger,
    RestoreStateSwagger,
    UpdateStateSwagger,
} from './swagger';

@ApiBaseController('areas/:slug/states', 'Area States', true)
export class StateController {
    constructor(private readonly facade: AreaFacade) {}

    @Get()
    @Public()
    @FindAllStatesSwagger()
    async getAll(
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Query() query: QueryParamsDto,
    ) {
        return this.facade.getStates(slug, query, userId);
    }

    @Get(':stateId')
    @FindOneStateSwagger()
    async findOne(
        @Param('slug') slug: string,
        @Param('stateId') stateId: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.getDetailState(slug, stateId, userId);
    }

    @Post()
    @CreateStateSwagger()
    async create(
        @Param('slug') slug: string,
        @Body() dto: CreateStateDto,
        @GetUserId() userId: string,
    ) {
        return this.facade.createState(slug, dto, userId);
    }

    @Delete(':stateId')
    @RemoveStateSwagger()
    async delete(
        @Param('slug') slug: string,
        @Param('stateId') stateId: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.deleteState(slug, stateId, userId);
    }

    @Patch(':stateId')
    @UpdateStateSwagger()
    async update(
        @Param('slug') slug: string,
        @Param('stateId') stateId: string,
        @Body() dto: UpdateStateDto,
        @GetUserId() userId: string,
    ) {
        return this.facade.updateState(slug, stateId, dto, userId);
    }

    @Post(':stateId/restore')
    @RestoreStateSwagger()
    async restore(
        @Param('slug') slug: string,
        @Param('stateId') stateId: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.restoreState(slug, stateId, userId);
    }

    @Post(':stateId/move')
    @MoveStateSwagger()
    async move(
        @Param('slug') slug: string,
        @Param('stateId') stateId: string,
        @Body() dto: MoveStateDto,
        @GetUserId() userId: string,
    ) {
        return this.facade.moveState(slug, stateId, dto, userId);
    }
}
