import { ApiBaseController } from '../../../shared/decorators';
import { Body, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../services';
import {
    PostLoginSwagger,
    PostLogoutSwagger,
    PostPasswordResetConfirmSwagger,
    PostPasswordResetSwagger,
    PostPasswordResetVerifySwagger,
    PostRefreshSwagger,
    PostRegisterSwagger,
    PostSignUpConfirmSwagger,
} from './auth.swagger';
import {
    PasswordResetConfirmDto,
    ResetPasswordDto,
    SignInDto,
    SignUpDto,
    VerifyDto,
    VerifyResetCodeDto,
} from '../dtos';
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

    @Post('sign-up/confirm')
    @PostSignUpConfirmSwagger()
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
        const { tokens, ...response } = await this.facade.signIn(dto, meta);

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

    @Post('password/reset')
    @PostPasswordResetSwagger()
    async resetPasswordRequest(@Body() dto: ResetPasswordDto) {
        return this.facade.resetPass(dto);
    }

    @Post('password/reset/verify')
    @PostPasswordResetVerifySwagger()
    async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
        return this.facade.verifyResetPassword(dto);
    }

    @Post('password/reset/confirm')
    @PostPasswordResetConfirmSwagger()
    async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
        return this.facade.confirmResetPass(dto);
    }
}
