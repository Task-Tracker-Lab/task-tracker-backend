import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { verify as verifyOTP } from 'otplib';
import { RegisterUserUseCase } from '@core/user';
import { BaseException } from '@shared/error';
import { ISessionRepository } from '../../domain/repository';
import { TokenService } from '../../infrastructure/security';
import { DeviceMetadata } from '../../infrastructure/utils/get-device-meta';
import { VerifyDto } from '../dtos';

@Injectable()
export class SignUpVerifyUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenService: TokenService,
        private readonly registerUserUseCase: RegisterUserUseCase,
    ) {}

    async execute(dto: VerifyDto, meta: DeviceMetadata) {
        const redisKey = `reg:${dto.email}`;
        const cachedData = await this.redis.get(redisKey);

        if (!cachedData) {
            throw new BaseException(
                {
                    code: 'REGISTRATION_EXPIRED',
                    message: 'Срок регистрации истек или email не найден. Попробуйте снова.',
                },
                HttpStatus.GONE,
            );
        }

        const userData = JSON.parse(cachedData);

        if (!userData) {
            throw new BaseException(
                {
                    code: 'INTERNAL_DATA_CORRUPTION',
                    message: 'Ошибка целостности данных. Попробуйте начать регистрацию заново.',
                },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }

        const verifyResult = await verifyOTP({
            token: dto.code,
            secret: userData.otp.secret,
            algorithm: 'sha256',
            digits: 6,
            period: 900,
            strategy: 'totp',
            afterTimeStep: 1,
        });

        if (!verifyResult.valid) {
            throw new BaseException(
                {
                    code: 'INVALID_OTP',
                    message: 'Неверный или истекший код подтверждения',
                    details: [{ target: 'code', message: 'OTP code is invalid or expired' }],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const user = await this.registerUserUseCase.execute({
            ...userData.user,
            password: userData.password,
        });

        const session = await this.sessionRepo.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            ...meta,
        });
        const { access, refresh } = await this.tokenService.generateTokens(user, session.id);

        await this.redis.del(redisKey);

        return {
            success: true,
            tokens: { access, refresh },
            message: 'Аккаунт успешно подтвержден',
        };
    }
}
