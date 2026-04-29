import { Body, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBaseController, GetUserId } from '@shared/decorators';
import {
    CreateTeamSwagger,
    FindOneTeamSwagger,
    RemoveTeamSwagger,
    UpdateTeamSwagger,
    CheckSlugSwagger,
} from './swagger';
import { CreateTeamDto, UpdateTeamDto } from '../../dtos';
import { TeamsFacade } from '../../team.facade';

@ApiBaseController('teams', 'Teams', true)
export class TeamsController {
    constructor(private readonly facade: TeamsFacade) {}

    @Post()
    @CreateTeamSwagger()
    async create(@GetUserId() userId: string, @Body() dto: CreateTeamDto) {
        return this.facade.createTeam(userId, dto);
    }

    @Get('check-slug/:slug')
    @CheckSlugSwagger()
    async checkSlug(@Param('slug') slug: string) {
        return this.facade.checkSlug(slug);
    }

    @Get(':slug')
    @FindOneTeamSwagger()
    async findOne(@Param('slug') slug: string) {
        return this.facade.getTeamBySlug(slug);
    }

    @Patch(':slug')
    @UpdateTeamSwagger()
    async update(
        @Param('slug') slug: string,
        @GetUserId() userId: string,
        @Body() dto: UpdateTeamDto,
    ) {
        return this.facade.updateTeam(slug, userId, dto);
    }

    @Delete(':slug')
    @RemoveTeamSwagger()
    @HttpCode(HttpStatus.OK)
    async remove(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.deleteTeam(slug, userId);
    }
}
