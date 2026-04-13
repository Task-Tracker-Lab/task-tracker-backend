import {
    Body,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ApiBaseController, GetUserId } from 'src/shared/decorators';
import { TeamsService } from '../services';
import { FindTagsQuery, SyncTagsDto } from '../dtos';
import {
    CreateTeamSwagger,
    FindAllTeamsSwagger,
    FindOneTeamSwagger,
    GetAllTagsSwagger,
    RemoveTeamSwagger,
    SyncTeamTagsSwagger,
    UpdateTeamSwagger,
} from './teams.swagger';

@ApiBaseController('teams', 'Teams', true)
export class TeamsController {
    constructor(private readonly facade: TeamsService) {}

    @Post()
    @CreateTeamSwagger()
    async create(@Body() dto: any, @GetUserId() userId: string) {
        return this.facade.create(userId, dto);
    }

    @Get()
    @FindAllTeamsSwagger()
    async findAll(@GetUserId() userId: string, @Query() query: any) {
        return this.facade.getAll(userId, query);
    }

    @Get('tags/all')
    @GetAllTagsSwagger()
    async getAllTags(@Query() query: FindTagsQuery) {
        return this.facade.getAllTags(query);
    }

    @Get(':slug')
    @FindOneTeamSwagger()
    async findOne(@Param('slug') slug: string) {
        return this.facade.getOne(slug);
    }

    @Patch(':slug')
    @UpdateTeamSwagger()
    async update(@Param('slug') slug: string, @Body() dto: any) {
        return this.facade.update(slug, dto);
    }

    @Delete(':slug')
    @RemoveTeamSwagger()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('slug') slug: string) {
        return this.facade.remove(slug);
    }

    @Put(':slug/tags')
    @SyncTeamTagsSwagger()
    async syncTags(@Param('slug') slug: string, @Body() dto: SyncTagsDto) {
        return this.facade.syncTags(slug, dto.tags);
    }
}
