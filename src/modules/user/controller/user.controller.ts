import { Body, Get, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../user.service';
import {
    GetMeActivitySwagger,
    GetMeSwagger,
    PatchMeNotificationsSwagger,
    PatchMeSwagger,
    PostMeAvatarSwagger,
} from './user.swagger';
import { UpdateNotificationsDto, UpdateProfileDto } from '../dtos';
import { ApiBaseController, GetUserId } from '../../../shared/decorators';
import { BearerAuthGuard } from 'src/shared/guards';
import { PaginationDto } from '../../../shared/dtos';

@ApiBaseController('users', 'Users')
@UseGuards(BearerAuthGuard)
export class UserController {
    constructor(private readonly facade: UserService) {}

    @Get('me')
    @GetMeSwagger()
    async getProfile(@GetUserId() id: string) {
        return this.facade.getProfile(id);
    }

    @Patch('me')
    @PatchMeSwagger()
    async updateProfile(@Body() dto: UpdateProfileDto, @GetUserId() id: string) {
        return this.facade.updateProfile(id, dto);
    }

    @Patch('me/notifications')
    @PatchMeNotificationsSwagger()
    async updateNotifications(@Body() settings: UpdateNotificationsDto, @GetUserId() id: string) {
        return this.facade.updateNotifications(id, settings);
    }

    @Get('me/activity')
    @GetMeActivitySwagger()
    async getActivity(@Query() query: PaginationDto, @GetUserId() id: string) {
        return this.facade.getActivity(id, query.page, query.limit);
    }

    @Post('me/avatar')
    @PostMeAvatarSwagger()
    async uploadAvatar() {
        return {
            avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka',
            success: true,
        };
    }
}
