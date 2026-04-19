import { Body, Get, Param, Delete, Patch, Post } from '@nestjs/common';
import { ApiBaseController, GetUser, GetUserId } from '@shared/decorators';
import { TeamInvitationsService } from '../services';
import { AcceptInviteSwagger, InviteMemberSwagger } from './teams.swagger';
import type { JwtPayload } from '@shared/types';
import { ApiOperation } from '@nestjs/swagger';

@ApiBaseController('teams/:slug/invitations', 'Teams Invitations', true)
export class TeamsInvitationsController {
    constructor(private readonly facade: TeamInvitationsService) {}

    @Get()
    @ApiOperation({ deprecated: true })
    async getAll() {}

    @Get(':invitationId')
    @ApiOperation({ deprecated: true })
    async getOne() {}

    @Post()
    @InviteMemberSwagger()
    async invite(@Param('slug') slug: string, @GetUserId() inviterId: string, @Body() dto: any) {
        return this.facade.invite(slug, inviterId, dto);
    }

    @Post(':code/accept')
    @AcceptInviteSwagger()
    async accept(@Param('code') code: string, @GetUser() user: JwtPayload) {
        return this.facade.acceptInvite(code, user.sub, user.email);
    }

    @Patch(':invitationId')
    @ApiOperation({ deprecated: true })
    async update() {}

    @Delete(':invitationId')
    @ApiOperation({ deprecated: true })
    async decline() {}
}
