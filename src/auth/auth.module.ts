import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '@core/user';
import { AuthController, AuthRecoveryController } from './application/controller';
import { AuthFacade } from './application/auth.facade';
import {
    ConfirmResetPasswordUseCase,
    VerifyResetPasswordUseCase,
    RefreshTokensUseCase,
    ResetPasswordUseCase,
    SignUpVerifyUseCase,
    SignInUseCase,
    SignOutUseCase,
    SignUpUseCase,
} from './application/use-cases';
import { AuthQueues } from './domain/enums';
import { SessionRepository } from './infrastructure/persistence/repositories';
import { TokenService } from './infrastructure/security';
import { BearerStrategy, CookieStrategy } from './infrastructure/strategies';
import { MailProcessor } from './infrastructure/workers';
import { MailAdapter } from '@shared/adapters/mail';

const USE_CASES = [
    ConfirmResetPasswordUseCase,
    VerifyResetPasswordUseCase,
    RefreshTokensUseCase,
    ResetPasswordUseCase,
    SignUpVerifyUseCase,
    SignInUseCase,
    SignOutUseCase,
    SignUpUseCase,
];

const WORKERS = [MailProcessor];

const REPOSITORY = {
    provide: 'ISessionRepository',
    useClass: SessionRepository,
};

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: async (cfg: ConfigService) => ({
                secret: cfg.get('JWT_ACCESS_SECRET'),
                signOptions: {
                    /**
                     * Использование 'any' здесь необходимо, так как Zod гарантирует
                     * формат строки (напр. '15m', '30d') через regex в ConfigSchema, но внутренний тип
                     * 'StringValue' из библиотеки 'ms' слишком строг для обычного string.
                     */
                    expiresIn: cfg.get<any>('JWT_ACCESS_EXPIRES_IN'),
                    algorithm: 'HS256',
                },
                verifyOptions: {
                    algorithms: ['HS256'],
                    ignoreExpiration: false,
                    clockTolerance: 10,
                },
            }),
        }),
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (cfg: ConfigService) => {
                const host = cfg.getOrThrow('REDIS_HOST', { infer: true });
                const port = cfg.get('REDIS_PORT');
                const password = cfg.get('REDIS_PASSWORD');
                const url = `redis://${host}${port ? `:${port}` : ''}`;

                return {
                    type: 'single',
                    url,
                    options: {
                        password,
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        },
                        commandTimeout: 3000,
                    },
                };
            },
        }),
        BullModule.registerQueue({
            name: AuthQueues.AUTH_MAIL,
        }),
        BullBoardModule.forFeature({
            name: AuthQueues.AUTH_MAIL,
            adapter: BullMQAdapter,
        }),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController, AuthRecoveryController],
    providers: [
        // TOOD: FIX PROVIDER
        {
            provide: 'IMailPort',
            useClass: MailAdapter,
        },
        ...WORKERS,
        TokenService,
        CookieStrategy,
        BearerStrategy,
        REPOSITORY,
        ...USE_CASES,
        AuthFacade,
    ],
    exports: [],
})
export class AuthModule {}
