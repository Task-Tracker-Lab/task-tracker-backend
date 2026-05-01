import { Body, Get, Patch, Post, Query } from '@nestjs/common';
import { GetMeActivitySwagger, GetMeSwagger, PatchMeSwagger, PostMeAvatarSwagger } from './swagger';
import { UpdateProfileDto } from '../../dtos';
import { ApiBaseController, ExtractFastifyFile, GetUserId } from '@shared/decorators';
import { UserFacade } from '../../user.facade';
import { PaginationDto } from '@shared/dtos';
import { FileUploadDto } from '@shared/media';

@ApiBaseController('users/me', 'Account Profile', true)
export class UserController {
    constructor(private readonly facade: UserFacade) {}

    @Get()
    @GetMeSwagger()
    async getProfile(@GetUserId() id: string) {
        return this.facade.getProfile(id);
    }

    @Patch()
    @PatchMeSwagger()
    async updateProfile(@Body() dto: UpdateProfileDto, @GetUserId() id: string) {
        return this.facade.updateProfile(id, dto);
    }

    @Get('activity')
    @GetMeActivitySwagger()
    async getActivity(@Query() query: PaginationDto, @GetUserId() id: string) {
        return this.facade.getActivity(id, query.page, query.limit);
    }

    @Post('avatar')
    @PostMeAvatarSwagger()
    async uploadAvatar(
        @ExtractFastifyFile() fileDto: FileUploadDto,
        @GetUserId()
        userId: string,
    ) {
        return this.facade.uploadAvatar(userId, fileDto);
    }
}
