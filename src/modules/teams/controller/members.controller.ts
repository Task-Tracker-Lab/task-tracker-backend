import { ApiBaseController, GetUserId } from 'src/shared/decorators';
import { TeamsService } from '../services';
import { Body, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
    GetMembersSwagger,
    InviteMemberSwagger,
    RemoveMemberSwagger,
    UpdateMemberSwagger,
} from './teams.swagger';

@ApiBaseController('teams/:slug', 'Teams', true)
export class MembersController {
    constructor(private readonly facade: TeamsService) {}

    @Get('members')
    @GetMembersSwagger()
    async getMembers(@Param('slug') slug: string) {
        return this.facade.getMembers(slug);
    }

    @Post('invitations')
    @InviteMemberSwagger()
    async invite(@Param('slug') slug: string, @GetUserId() inviterId: string, @Body() dto: any) {
        return this.facade.invite(slug, inviterId, dto);
    }

    @Patch('members/:userId')
    @UpdateMemberSwagger()
    async updateMember(
        @Param('slug') slug: string,
        @Param('userId') userId: string,
        @Body() dto: any,
    ) {
        return this.facade.updateMember(slug, userId, dto);
    }

    @Delete('members/:userId')
    @RemoveMemberSwagger()
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeMember(@Param('slug') slug: string, @Param('userId') userId: string) {
        return this.facade.removeMember(slug, userId);
    }
}
