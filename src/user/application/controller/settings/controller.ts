import { Body, Patch } from '@nestjs/common';
import { UserFacade } from '../../user.facade';
import { PatchMeNotificationsSwagger } from './swagger';
import { ApiBaseController, GetUserId } from '@shared/decorators';
import { UpdateNotificationsDto } from '../../dtos';

@ApiBaseController('users/me', 'Account Settings', true)
export class UserSettingsController {
    constructor(private readonly facade: UserFacade) {}

    @Patch('notifications')
    @PatchMeNotificationsSwagger()
    async updateNotifications(@Body() settings: UpdateNotificationsDto, @GetUserId() id: string) {
        return this.facade.updateNotifications(id, settings);
    }
}
