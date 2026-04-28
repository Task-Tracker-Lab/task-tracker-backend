import { InjectRedis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { generate, generateSecret } from 'otplib';
import { FindOneUserCommand } from '@core/modules/user';
import { BaseException } from '@shared/error';
import { AuthMailJobs, AuthQueues } from '../../domain/enums';
import { ResetPasswordEvent } from '../../domain/events';
import { ResetPasswordDto } from '../dtos';

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(AuthQueues.AUTH_MAIL)
        private readonly mailQueue: Queue,
        private readonly findUserCommand: FindOneUserCommand,
    ) {}

    async execute(dto: ResetPasswordDto) {
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
        await this.mailQueue.add(AuthMailJobs.SEND_RESET_PASSWORD, event, {
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
    }
}
