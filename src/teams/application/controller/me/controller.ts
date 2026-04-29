import { ApiBaseController, GetUser, GetUserId } from '@shared/decorators';
import { Get, Query } from '@nestjs/common';
import { FindInvitesSwagger, FindTeamsSwagger } from './swagger';
import type { JwtPayload } from '@shared/types';
import { TeamsFacade } from '../../team.facade';

@ApiBaseController('users/me', 'Account Teams', true)
export class MeController {
    constructor(private readonly facade: TeamsFacade) {}

    @Get('teams')
    @FindTeamsSwagger()
    // TODO: ADD TO QUERY DTO
    async findMyTeams(@GetUserId() userId: string, @Query() query: any) {
        return this.facade.getMyTeams(userId, query);
    }

    @Get('invites')
    @FindInvitesSwagger()
    async findMyInvites(@GetUser() user: JwtPayload) {
        return this.facade.getMyInvites(user.email);
    }
}
