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
import { ApiBaseController, ExtractFastifyFile, GetUser, GetUserId } from 'src/shared/decorators';
import { TeamsService } from '../services';
import {
    CreateTeamSwagger,
    FindOneTeamSwagger,
    RemoveTeamSwagger,
    SyncTeamTagsSwagger,
    UpdateTeamSwagger,
    PatchTeamAvatarSwagger,
    PatchTeamBannerSwagger,
    FindTeamsSwagger,
    CheckSlugSwagger,
    FindInvitesSwagger,
} from './teams.swagger';
import type { FileUploadDto } from '../../media/dtos';
import type { CreateTeamDto, SyncTagsDto } from '../dtos';
import type { JwtPayload } from 'src/modules/auth/types';

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

    @Get('my')
    @FindTeamsSwagger()
    async findAll(@GetUserId() userId: string, @Query() query: any) {
        return this.facade.getAll(userId, query);
    }

    @Get('my/invites')
    @FindInvitesSwagger()
    async findAllInvites(@GetUser() user: JwtPayload) {
        return this.facade.getMyInvites(user.email);
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

    @Put(':slug/tags')
    @SyncTeamTagsSwagger()
    async syncTags(@Param('slug') slug: string, @Body() dto: SyncTagsDto) {
        return this.facade.syncTags(slug, dto.tags);
    }

    @Patch(':slug/avatar')
    @PatchTeamAvatarSwagger()
    async updateTeamAvatar(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamAvatar(slug, fileDto);
    }

    @Patch(':slug/banner')
    @PatchTeamBannerSwagger()
    async updateTeamBanner(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamBanner(slug, fileDto);
    }
}
