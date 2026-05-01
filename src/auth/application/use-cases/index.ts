import { ConfirmResetPasswordUseCase } from './confirm-reset-password.use-case';
import { VerifyResetPasswordUseCase } from './verify-reset-password.use-case';
import { RefreshTokensUseCase } from './refresh-tokens.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { SignUpVerifyUseCase } from './sign-up-verify.use-case';
import { SignInUseCase } from './sign-in.use-case';
import { SignOutUseCase } from './sign-out.use-case';
import { SignUpUseCase } from './sign-up.use-case';

export {
    ConfirmResetPasswordUseCase,
    VerifyResetPasswordUseCase,
    RefreshTokensUseCase,
    ResetPasswordUseCase,
    SignUpVerifyUseCase,
    SignInUseCase,
    SignOutUseCase,
    SignUpUseCase,
};

export const AuthUseCases = [
    ConfirmResetPasswordUseCase,
    VerifyResetPasswordUseCase,
    RefreshTokensUseCase,
    ResetPasswordUseCase,
    SignUpVerifyUseCase,
    SignInUseCase,
    SignOutUseCase,
    SignUpUseCase,
];
