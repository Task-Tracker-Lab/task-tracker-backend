import { ApiBaseController } from '../../../shared/decorators';
import { Body, Post } from '@nestjs/common';
import { AuthRecoveryService } from '../services';
import {
    PostPasswordResetConfirmSwagger,
    PostPasswordResetSwagger,
    PostPasswordResetVerifySwagger,
} from './auth.swagger';
import { PasswordResetConfirmDto, ResetPasswordDto, VerifyResetCodeDto } from '../dtos';

@ApiBaseController('auth', 'Auth Recovery')
export class AuthRecoveryController {
    constructor(private readonly facade: AuthRecoveryService) {}

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
