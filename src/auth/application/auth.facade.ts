import { Injectable } from '@nestjs/common';
import {
    SignInUseCase,
    SignUpUseCase,
    SignOutUseCase,
    SignUpVerifyUseCase,
    RefreshTokensUseCase,
    ResetPasswordUseCase,
    VerifyResetPasswordUseCase,
    ConfirmResetPasswordUseCase,
} from './use-cases';
import {
    PasswordResetConfirmDto,
    ResetPasswordDto,
    SignInDto,
    SignUpDto,
    VerifyDto,
    VerifyResetCodeDto,
} from './dtos';
import type { DeviceMetadata } from '../infrastructure/utils/get-device-meta';

@Injectable()
export class AuthFacade {
    constructor(
        private readonly signInUseCase: SignInUseCase,
        private readonly signUpUseCase: SignUpUseCase,
        private readonly signOutUseCase: SignOutUseCase,
        private readonly signUpVerifyUseCase: SignUpVerifyUseCase,
        private readonly refreshTokensUseCase: RefreshTokensUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly verifyResetPasswordUseCase: VerifyResetPasswordUseCase,
        private readonly confirmResetPasswordUseCase: ConfirmResetPasswordUseCase,
    ) {}

    async signIn(dto: SignInDto, device: DeviceMetadata) {
        return this.signInUseCase.execute(dto, device);
    }

    async signUp(dto: SignUpDto) {
        return this.signUpUseCase.execute(dto);
    }

    async verifySignUp(dto: VerifyDto, device: DeviceMetadata) {
        return this.signUpVerifyUseCase.execute(dto, device);
    }

    async signOut(userId: string) {
        return this.signOutUseCase.execute(userId);
    }

    async refreshTokens(token: string, device: DeviceMetadata) {
        return this.refreshTokensUseCase.execute(token, device);
    }

    async sendResetCode(dto: ResetPasswordDto) {
        return this.resetPasswordUseCase.execute(dto);
    }

    async verifyResetCode(dto: VerifyResetCodeDto) {
        return this.verifyResetPasswordUseCase.execute(dto);
    }

    async confirmNewPassword(dto: PasswordResetConfirmDto) {
        return this.confirmResetPasswordUseCase.execute(dto);
    }
}
