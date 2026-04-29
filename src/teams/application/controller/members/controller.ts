import { Body, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiBaseController, GetUserId } from '@shared/decorators';
import { GetMembersSwagger, RemoveMemberSwagger, UpdateMemberSwagger } from './swagger';
import type { UpdateMemberDto } from '../../dtos/member.dto';
import { TeamsFacade } from '../../team.facade';

@ApiBaseController('teams/:slug', 'Teams Members', true)
export class TeamsMembersController {
    constructor(private readonly facade: TeamsFacade) {}

    @Get('members')
    @GetMembersSwagger()
    async getMembers(@Param('slug') slug: string) {
        return this.facade.getMembers(slug);
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
