import { ApiBaseController } from '../../../shared/decorators';
import { Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { AuthService } from '../auth.service';
import {
    DeleteTerminateSessionSwagger,
    GetSessionsSwagger,
    PostChangePasswordSwagger,
    PostConfirm2faSwagger,
    PostDisable2faSwagger,
    PostEnable2faSwagger,
    PostLoginSwagger,
    PostLogoutSwagger,
    PostRefreshSwagger,
    PostRegisterSwagger,
} from './auth.swagger';

@ApiBaseController('auth', 'Auth')
export class AuthController {
    constructor(private readonly facade: AuthService) {}

    @Post('sign-up')
    @PostRegisterSwagger()
    async register() {}

    @Post('sign-in')
    @PostLoginSwagger()
    @HttpCode(200)
    async login() {}

    @Post('sign-out')
    @PostLogoutSwagger()
    @HttpCode(200)
    async logout() {}

    @Post('refresh')
    @PostRefreshSwagger()
    @HttpCode(200)
    async refresh() {}

    @Get('sessions')
    @GetSessionsSwagger()
    async getSessions() {}

    @Delete('sessions/:cuid')
    @DeleteTerminateSessionSwagger()
    async terminateSession() {}

    @Post('change-password')
    @PostChangePasswordSwagger()
    @HttpCode(200)
    async changePassword() {}

    @Post('2fa/enable')
    @HttpCode(200)
    @PostEnable2faSwagger()
    async enable2fa() {}

    @Patch('2fa/disable')
    @PostDisable2faSwagger()
    async disable2fa() {}

    @Post('2fa/confirm')
    @HttpCode(200)
    @PostConfirm2faSwagger()
    async confirm2fa() {}
}
