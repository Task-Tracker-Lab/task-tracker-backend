import { Body, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBaseController, GetUserId } from '@shared/decorators';
import { TeamsService } from '../services';
import {
    CreateTeamSwagger,
    FindOneTeamSwagger,
    RemoveTeamSwagger,
    UpdateTeamSwagger,
    CheckSlugSwagger,
} from './teams.swagger';
import { CreateTeamDto } from '../dtos';

@ApiBaseController('teams', 'Teams', true)
export class TeamsController {
    constructor(private readonly facade: TeamsService) {}

    @Post()
    @CreateTeamSwagger()
    async create(@GetUserId() userId: string, @Body() dto: CreateTeamDto) {
        return this.facade.create(userId, dto);
    }

    @Get('check-slug/:slug')
    @CheckSlugSwagger()
    async checkSlug(@Param('slug') slug: string) {
        return this.facade.checkSlug(slug);
    }

    @Get(':slug')
    @FindOneTeamSwagger()
    async findOne(@Param('slug') slug: string) {
        return this.facade.getOne(slug);
    }

    @Patch(':slug')
    @UpdateTeamSwagger()
    async update(@Param('slug') slug: string, @GetUserId() userId: string, @Body() dto: any) {
        return this.facade.update(slug, userId, dto);
    }

    @Delete(':slug')
    @RemoveTeamSwagger()
    @HttpCode(HttpStatus.OK)
    async remove(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.remove(slug, userId);
    }
}
