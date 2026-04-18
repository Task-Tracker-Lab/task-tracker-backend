import { Body, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../services';
import {
    GetMeActivitySwagger,
    GetMeSwagger,
    PatchMeSwagger,
    PostMeAvatarSwagger,
} from './user.swagger';
import type { UpdateProfileDto } from '../dtos';
import { ApiBaseController, ExtractFastifyFile, GetUserId } from '../../../shared/decorators';
import { BearerAuthGuard } from '@shared/guards';
import type { PaginationDto } from '../../../shared/dtos';
import type { FileUploadDto } from '../../media/dtos';

@ApiBaseController('users/me', 'Account Profile')
@UseGuards(BearerAuthGuard)
export class UserController {
    constructor(private readonly facade: UserService) {}

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
