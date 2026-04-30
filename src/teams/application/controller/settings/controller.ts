import { Body, Param, Patch, Put } from '@nestjs/common';
import { ApiBaseController, ExtractFastifyFile } from '@shared/decorators';
import { SyncTeamTagsSwagger, PatchTeamAvatarSwagger, PatchTeamBannerSwagger } from './swagger';
import { SyncTagsDto } from '../../dtos';
import { TeamsFacade } from '../../team.facade';
import { FileUploadDto } from '@shared/media';

@ApiBaseController('teams/:slug', 'Teams Settings', true)
export class TeamsSettingsController {
    constructor(private readonly facade: TeamsFacade) {}

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
        return this.facade.updateAvatar(slug, fileDto);
    }

    @Patch('banner')
    @PatchTeamBannerSwagger()
    async updateTeamBanner(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @Param('slug') slug: string,
    ) {
        return this.facade.updateBanner(slug, fileDto);
    }
}
