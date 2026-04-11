import { ApiBaseController } from '../../../shared/decorators';
import { Body, Delete, Get, HttpCode, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
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
import { SignInDto, SignUpDto, VerifyDto } from '../dtos';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { getDeviceMeta } from '../helpers';
import { BearerAuthGuard, CookieAuthGuard } from 'src/shared/guards';

@ApiBaseController('auth', 'Auth')
export class AuthController {
    constructor(private readonly facade: AuthService) {}

    @Post('sign-up')
    @PostRegisterSwagger()
    @HttpCode(202)
    async signUp(@Body() dto: SignUpDto) {
        return this.facade.signUp(dto);
    }

    @Post('verify')
    @PostRegisterSwagger()
    @HttpCode(201)
    async verify(
        @Res({ passthrough: true }) res: FastifyReply,
        @Req() req: FastifyRequest,
        @Body() dto: VerifyDto,
    ) {
        const meta = getDeviceMeta(req);
        const { tokens, ...response } = await this.facade.verify(dto, meta);

        res.setCookie('refresh', tokens.refresh, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
        });

        return { ...response, token: tokens.access };
    }

    @Post('sign-in')
    @PostLoginSwagger()
    async signIn(
        @Res({ passthrough: true }) res: FastifyReply,
        @Req() req: FastifyRequest,
        @Body() dto: SignInDto,
    ) {
        const meta = getDeviceMeta(req);
        const { tokens, ...response } = await this.facade.sigIn(dto, meta);

        res.setCookie('refresh', tokens.refresh, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
        });

        return { ...response, token: tokens.access };
    }

    @Post('sign-out')
    @UseGuards(BearerAuthGuard)
    @PostLogoutSwagger()
    async logout(@Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        const session = req.cookies['refresh'];
        const response = await this.facade.signOut(session);

        res.clearCookie('refresh', { path: '/' });

        return response;
    }

    @Post('refresh')
    @UseGuards(CookieAuthGuard)
    @PostRefreshSwagger()
    @HttpCode(200)
    async refresh(@Res({ passthrough: true }) res: FastifyReply, @Req() req: FastifyRequest) {
        const meta = getDeviceMeta(req);
        const session = req.cookies['refresh'];
        const { tokens, ...response } = await this.facade.refresh(session, meta);

        res.setCookie('refresh', tokens.refresh, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
        });

        return { token: tokens.access, ...response };
    }

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
