import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import Redis from 'ioredis';
import { BaseException } from '@shared/error';
import { PasswordResetConfirmDto } from '../dtos';
import { UpdatePasswordUseCase } from '@core/user';

@Injectable()
export class ConfirmResetPasswordUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        private readonly updatePasswordUserUseCase: UpdatePasswordUseCase,
    ) {}

    async execute(dto: PasswordResetConfirmDto) {
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
        const isUpdated = await this.updatePasswordUserUseCase.execute(dto.email, hashed);

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
    }
}
