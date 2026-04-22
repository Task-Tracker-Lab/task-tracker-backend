import { Body, Patch, UseGuards } from '@nestjs/common';
import { UserSettingsService } from '../services';
import { PatchMeNotificationsSwagger } from './user.swagger';
import type { UpdateNotificationsDto } from '../dtos';
import { ApiBaseController, GetUserId } from '../../../shared/decorators';
import { BearerAuthGuard } from '@shared/guards';

@ApiBaseController('users/me', 'Account Settings')
@UseGuards(BearerAuthGuard)
export class UserSettingsController {
    constructor(private readonly facade: UserSettingsService) {}

    @Patch('notifications')
    @PatchMeNotificationsSwagger()
    async updateNotifications(@Body() settings: UpdateNotificationsDto, @GetUserId() id: string) {
        return this.facade.updateNotifications(id, settings);
    }
}
