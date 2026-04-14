import { Body, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBaseController, ExtractFastifyFile, GetUserId } from 'src/shared/decorators';
import { TeamsService } from '../services';
import {
    CreateTeamSwagger,
    // FindAllTeamsSwagger,
    FindOneTeamSwagger,
    RemoveTeamSwagger,
    SyncTeamTagsSwagger,
    UpdateTeamSwagger,
    PatchTeamAvatarSwagger,
    PatchTeamBannerSwagger,
} from './teams.swagger';
import { FileUploadDto } from '../../media/dtos';
import { CreateTeamDto, SyncTagsDto } from '../dtos';

@ApiBaseController('teams', 'Teams', true)
export class TeamsController {
    constructor(private readonly facade: TeamsService) {}

    @Post()
    @CreateTeamSwagger()
    async create(@GetUserId() userId: string, @Body() dto: CreateTeamDto) {
        return this.facade.create(userId, dto);
    }

    // @Get('my')
    // @FindAllTeamsSwagger()
    // async findAll(@GetUserId() userId: string, @Query() query: any) {
    //     return this.facade.getAll(userId, query);
    // }

    // @Get('my/invites')
    // @FindAllTeamsSwagger()
    // async findAllInvites(@GetUserId() userId: string, @Query() query: any) {
    //     return this.facade.getAllInvites(userId, query);
    // }

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

    @Put(':slug/tags')
    @SyncTeamTagsSwagger()
    async syncTags(@Param('slug') slug: string, @Body() dto: SyncTagsDto) {
        return this.facade.syncTags(slug, dto.tags);
    }

    // UseGuards(RolesGuard) - team owner
    @Patch(':slug/avatar')
    @PatchTeamAvatarSwagger()
    async updateTeamAvatar(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamAvatar(slug, fileDto);
    }

    // UseGuards(RolesGuard) - team owner
    @Patch(':slug/banner')
    @PatchTeamBannerSwagger()
    async updateTeamBanner(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamBanner(slug, fileDto);
    }
}
