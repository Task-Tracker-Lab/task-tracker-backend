import { ApiBaseController, GetUser, GetUserId } from '@shared/decorators';
import { MeService } from '../services';
import { Get, Query } from '@nestjs/common';
import { FindInvitesSwagger, FindTeamsSwagger } from './teams.swagger';
import type { JwtPayload } from '@core/modules/auth/types';

@ApiBaseController('users/me', 'User Context in Teams', true)
export class MeController {
    constructor(private readonly facade: MeService) {}

    @Get('teams')
    @FindTeamsSwagger()
    // TODO: ADD TO QUERY DTO
    async findMyTeams(@GetUserId() userId: string, @Query() query: any) {
        return this.facade.getAll(userId, query);
    }

    @Get('invites')
    @FindInvitesSwagger()
    async findMyInvites(@GetUser() user: JwtPayload) {
        return this.facade.getMyInvites(user.email);
    }
}
