import { Body, Get, Param, Delete, Patch, Post } from '@nestjs/common';
import { ApiBaseController, GetUser, GetUserId } from '@shared/decorators';
import { TeamInvitationsService } from '../services';
import {
    AcceptInviteSwagger,
    DeleteTeamInvitationSwagger,
    GetTeamInvitationSwagger,
    GetTeamInvitationsSwagger,
    InviteMemberSwagger,
    UpdateTeamInvitationSwagger,
} from './teams.swagger';
import type { JwtPayload } from '@shared/types';
import { InviteMemberDto, UpdateInvitationDto } from '../dtos';

@ApiBaseController('teams/:slug/invitations', 'Teams Invitations', true)
export class TeamsInvitationsController {
    constructor(private readonly facade: TeamInvitationsService) {}

    @Get()
    @GetTeamInvitationsSwagger()
    async getAll(@Param('slug') slug: string, @GetUserId() userId: string) {
        return this.facade.getInvitations(slug, userId);
    }

    @Get(':code')
    @GetTeamInvitationSwagger()
    async getOne(
        @Param('slug') slug: string,
        @Param('code') code: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.getInvitation(slug, code, userId);
    }

    @Post()
    @InviteMemberSwagger()
    async invite(
        @Param('slug') slug: string,
        @GetUserId() inviterId: string,
        @Body() dto: InviteMemberDto,
    ) {
        return this.facade.invite(slug, inviterId, dto);
    }

    @Post(':code/accept')
    @AcceptInviteSwagger()
    async accept(@Param('code') code: string, @GetUser() user: JwtPayload) {
        return this.facade.acceptInvite(code, user.sub, user.email);
    }

    @Patch(':code')
    @UpdateTeamInvitationSwagger()
    async update(
        @Param('slug') slug: string,
        @Param('code') code: string,
        @GetUserId() userId: string,
        @Body() dto: UpdateInvitationDto,
    ) {
        return this.facade.updateInvitation(slug, code, userId, dto);
    }

    @Delete(':code')
    @DeleteTeamInvitationSwagger()
    async decline(
        @Param('slug') slug: string,
        @Param('code') code: string,
        @GetUserId() userId: string,
    ) {
        return this.facade.declineInvitation(slug, code, userId);
    }
}
