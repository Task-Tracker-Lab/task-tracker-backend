import { InjectRedis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { generate, generateSecret } from 'otplib';
import { FindOneUserCommand } from '@core/modules/user';
import { BaseException } from '@shared/error';
import { AuthQueues, AuthMailJobs } from '../../domain/enums';
import { RegisterCodeEvent } from '../../domain/events';
import { SignUpDto } from '../dtos';

@Injectable()
export class SignUpUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(AuthQueues.AUTH_MAIL)
        private readonly mailQueue: Queue,
        private readonly findUserCommand: FindOneUserCommand,
    ) {}

    async execute(dto: SignUpDto) {
        const redisKey = `reg:${dto.email}`;

        const cachedData = await this.redis.get(redisKey);

        if (cachedData) {
            throw new BaseException(
                {
                    code: 'REGISTRATION_IN_PROGRESS',
                    message: 'Код уже был отправлен. Проверьте почту или подождите 15 минут.',
                    details: [{ target: 'email', message: 'Verification code already sent' }],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        const isExists = await this.findUserCommand.execute({ email: dto.email });

        if (isExists) {
            throw new BaseException(
                {
                    code: 'USER_ALREADY_EXISTS',
                    message: 'Email уже занят другим аккаунтом',
                    details: [{ target: 'email', value: dto.email }],
                },
                HttpStatus.CONFLICT,
            );
        }

        const hashPass = await argon.hash(dto.password);

        const secret = generateSecret();
        const token = await generate({
            secret,
            algorithm: 'sha256',
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        const data = {
            user: dto,
            password: hashPass,
            otp: { token, secret },
        };

        await this.redis.set(`reg:${dto.email}`, JSON.stringify(data), 'EX', 900);

        const event = new RegisterCodeEvent(dto.email, dto.firstName, token);
        await this.mailQueue.add(AuthMailJobs.SEND_REGISTER_CODE, event, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });

        return {
            success: true,
            message: 'Код подтверждения отправлен на вашу почту',
        };
    }
}
