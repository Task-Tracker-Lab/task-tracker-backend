import { Body, Param, Patch, Put } from '@nestjs/common';
import { ApiBaseController, ExtractFastifyFile } from '@shared/decorators';
import { TeamsSettingsService } from '../services';
import {
    SyncTeamTagsSwagger,
    PatchTeamAvatarSwagger,
    PatchTeamBannerSwagger,
} from './teams.swagger';
import type { FileUploadDto } from '../../media';
import type { SyncTagsDto } from '../dtos';

@ApiBaseController('teams/:slug', 'Teams Settings', true)
export class TeamsSettingsController {
    constructor(private readonly facade: TeamsSettingsService) {}

    @Put('tags')
    @SyncTeamTagsSwagger()
    async syncTags(@Param('slug') slug: string, @Body() dto: SyncTagsDto) {
        return this.facade.syncTags(slug, dto.tags);
    }

    @Patch('avatar')
    @PatchTeamAvatarSwagger()
    async updateTeamAvatar(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamAvatar(slug, fileDto);
    }

    @Patch('banner')
    @PatchTeamBannerSwagger()
    async updateTeamBanner(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateTeamBanner(slug, fileDto);
    }
}
