import { Module, forwardRef } from '@nestjs/common';
import { UserModule } from '../user';
import { AuthController } from './controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';

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
                const host = cfg.get('REDIS_HOST', { infer: true });
                const port = cfg.get('REDIS_PORT', { infer: true });

                return {
                    type: 'single',
                    url: `redis://${host}:${port}`,
                    options: {
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        },
                        commandTimeout: 3000,
                    },
                };
            },
        }),
        forwardRef(() => UserModule),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [],
})
export class AuthModule {}
