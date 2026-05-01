import { ApiBaseController } from '@shared/decorators';
import { Body, Post } from '@nestjs/common';
import {
    PostPasswordResetConfirmSwagger,
    PostPasswordResetSwagger,
    PostPasswordResetVerifySwagger,
} from './swagger';
import { PasswordResetConfirmDto, ResetPasswordDto, VerifyResetCodeDto } from '../../dtos';
import { AuthFacade } from '../../auth.facade';

@ApiBaseController('auth', 'Auth Recovery')
export class AuthRecoveryController {
    constructor(private readonly facade: AuthFacade) {}

    @Post('password/reset')
    @PostPasswordResetSwagger()
    async sendResetCode(@Body() dto: ResetPasswordDto) {
        return this.facade.sendResetCode(dto);
    }

    @Post('password/reset/verify')
    @PostPasswordResetVerifySwagger()
    async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
        return this.facade.verifyResetCode(dto);
    }

    @Post('password/reset/confirm')
    @PostPasswordResetConfirmSwagger()
    async confirmNewPassword(@Body() dto: PasswordResetConfirmDto) {
        return this.facade.confirmNewPassword(dto);
    }
}
