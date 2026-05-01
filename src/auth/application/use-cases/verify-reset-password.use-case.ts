import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { verify as verifyOTP } from 'otplib';
import { BaseException } from '@shared/error';
import { VerifyResetCodeDto } from '../dtos';

@Injectable()
export class VerifyResetPasswordUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
    ) {}

    async execute(dto: VerifyResetCodeDto) {
        const redisKey = `pass:reset:${dto.email}`;
        const cachedData = await this.redis.get(redisKey);

        if (!cachedData) {
            throw new BaseException(
                {
                    code: 'RESET_SESSION_EXPIRED',
                    message:
                        'Время подтверждения истекло или запрос не найден. Запросите код снова.',
                },
                HttpStatus.GONE,
            );
        }

        const resetSession = JSON.parse(cachedData);

        const verifyResult = await verifyOTP({
            token: dto.code,
            secret: resetSession.otp.secret,
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        if (!verifyResult.valid) {
            throw new BaseException(
                {
                    code: 'INVALID_VERIFICATION_CODE',
                    message: 'Неверный или истекший код подтверждения',
                    details: [{ target: 'code', message: 'The provided OTP is incorrect' }],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        await this.redis.set(
            redisKey,
            JSON.stringify({ ...resetSession, isVerified: true }),
            'EX',
            600,
        );

        return {
            success: true,
            message: 'Код успешно подтвержден. Теперь вы можете установить новый пароль.',
        };
    }
}
