import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user';
import { AuthController, AuthRecoveryController } from './controller';
import { AuthRecoveryService, AuthService, TokenService } from './services';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { SessionRepository } from './repository';
import { BearerStrategy, CookieStrategy } from './strategies';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from '@shared/workers';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

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
            name: Queues.MAIL,
        }),
        BullBoardModule.forFeature({
            name: Queues.MAIL,
            adapter: BullMQAdapter,
        }),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController, AuthRecoveryController],
    providers: [
        REPOSITORY,
        AuthService,
        TokenService,
        CookieStrategy,
        BearerStrategy,
        AuthRecoveryService,
    ],
    exports: [],
})
export class AuthModule {}
