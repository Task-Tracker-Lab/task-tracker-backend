import { BadRequestException, Body, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { FastifyRequest } from 'fastify';

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
    async uploadAvatar(@Req() req: FastifyRequest, @GetUserId() userId: string) {
        if (!req.isMultipart()) {
            throw new BadRequestException('Request is not multipart');
        }

        const file = await req.file();
        if (!file || file.fieldname !== 'file') {
            throw new BadRequestException('Поле file не найдено');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Недопустимый формат файла');
        }

        const buffer = await file.toBuffer();

        return this.facade.uploadAvatar(userId, {
            buffer,
            filename: file.filename,
            mimetype: file.mimetype,
        });
    }
}
