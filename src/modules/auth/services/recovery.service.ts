import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { PasswordResetConfirmDto, ResetPasswordDto, VerifyResetCodeDto } from '../dtos';
import { generate, generateSecret, verify as verifyOTP } from 'otplib';
import * as argon from 'argon2';
import { FindOneUserCommand, UpdatePassUserCommand } from '../../user';
import { InjectQueue } from '@nestjs/bullmq';
import { Queues } from '@shared/workers';
import type { Queue } from 'bullmq';
import { MailJobs } from '@shared/workers/enum';
import { ResetPasswordEvent } from '@shared/workers/events';
import { BaseException } from '@shared/error';

@Injectable()
export class AuthRecoveryService {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(Queues.MAIL)
        private readonly mailQueue: Queue,
        private readonly findUserCommand: FindOneUserCommand,
        private readonly updateUserPass: UpdatePassUserCommand,
    ) {}

    public resetPass = async (dto: ResetPasswordDto) => {
        const entity = await this.findUserCommand.execute({ email: dto.email });

        if (!entity.user) {
            throw new BaseException(
                {
                    code: 'USER_NOT_FOUND',
                    message: 'Пользователь с таким email не найден',
                    details: [{ target: 'email', value: dto.email }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const secret = generateSecret();
        const token = await generate({
            secret,
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        const resetPayload = {
            email: entity.user.email,
            otp: { secret, token },
            isVerified: false,
        };

        await this.redis.set(`pass:reset:${dto.email}`, JSON.stringify(resetPayload), 'EX', 900);

        const event = new ResetPasswordEvent(dto.email, token);
        await this.mailQueue.add(MailJobs.SEND_RESET_PASSWORD, event, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });

        return {
            success: true,
            message: 'Код для восстановления пароля отправлен на вашу почту',
        };
    };

    public verifyResetPassword = async (dto: VerifyResetCodeDto) => {
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
    };

    public confirmResetPass = async (dto: PasswordResetConfirmDto) => {
        const redisKey = `pass:reset:${dto.email}`;
        const cachedData = await this.redis.get(redisKey);

        if (!cachedData) {
            throw new BaseException(
                {
                    code: 'RESET_SESSION_NOT_FOUND',
                    message:
                        'Сессия восстановления не найдена или истекла. Начните процесс заново.',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const resetSession = JSON.parse(cachedData);

        if (!resetSession.isVerified) {
            throw new BaseException(
                {
                    code: 'CODE_NOT_VERIFIED',
                    message: 'Код подтверждения еще не был верифицирован.',
                    details: [{ target: 'isVerified', value: false }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const hashed = await argon.hash(dto.password);
        const isUpdated = await this.updateUserPass.execute(dto.email, hashed);

        if (!isUpdated) {
            throw new BaseException(
                {
                    code: 'PASSWORD_UPDATE_FAILED',
                    message: 'Не удалось обновить пароль. Попробуйте позже.',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
        await this.redis.del(redisKey);

        return {
            success: true,
            message: 'Пароль успешно изменен. Теперь вы можете войти в аккаунт.',
        };
    };
}
