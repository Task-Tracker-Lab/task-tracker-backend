import { Body, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBaseController, GetUser, GetUserId } from 'src/shared/decorators';
import { MembersService } from '../services';
import {
    AcceptInviteSwagger,
    GetMembersSwagger,
    InviteMemberSwagger,
    RemoveMemberSwagger,
    UpdateMemberSwagger,
} from './teams.swagger';
import type { JwtPayload } from 'src/modules/auth/types';
import type { UpdateMemberDto } from '../dtos/member.dto';

@ApiBaseController('teams/:slug', 'Teams', true)
export class MembersController {
    constructor(private readonly facade: MembersService) {}

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

    @Post('invitations/:code/accept')
    @AcceptInviteSwagger()
    async accept(@Param('code') code: string, @GetUser() user: JwtPayload) {
        return this.facade.acceptInvite(code, user.sub, user.email);
    }

    @Patch('members/:userId')
    @UpdateMemberSwagger()
    async updateMember(
        @Param('slug') slug: string,
        @Param('userId') targetUserId: string,
        @GetUserId() currentUserId: string,
        @Body() dto: UpdateMemberDto,
    ) {
        return this.facade.updateMember(slug, currentUserId, targetUserId, dto);
    }

    @Delete('members/:userId')
    @RemoveMemberSwagger()
    async removeMember(
        @Param('slug') slug: string,
        @Param('userId') targerUserId: string,
        @GetUserId() currentUserId: string,
    ) {
        return this.facade.removeMember(slug, currentUserId, targerUserId);
    }
}
