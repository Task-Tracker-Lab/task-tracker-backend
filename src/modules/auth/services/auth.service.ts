import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { SignInDto, SignUpDto, VerifyDto } from '../dtos';
import { generate, generateSecret, verify as verifyOTP } from 'otplib';
import * as argon from 'argon2';
import { CreateUserCommand, FindOneUserCommand } from '../../user';
import { TokenService } from './token.service';
import { ISessionRepository } from '../repository';
import { DeviceMetadata } from '../helpers';
import { InjectQueue } from '@nestjs/bullmq';
import { Queues, RegisterCodeEvent } from '@shared/workers';
import type { Queue } from 'bullmq';
import { MailJobs } from '@shared/workers/enum';
import { BaseException } from '@shared/error';

@Injectable()
export class AuthService {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        @InjectQueue(Queues.MAIL)
        private readonly mailQueue: Queue,
        private readonly tokenService: TokenService,
        private readonly findUserCommand: FindOneUserCommand,
        private readonly createUserCommand: CreateUserCommand,
    ) {}

    public signUp = async (dto: SignUpDto) => {
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
        await this.mailQueue.add(MailJobs.SEND_REGISTER_CODE, event, {
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
    };

    public verify = async (dto: VerifyDto, meta: DeviceMetadata) => {
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

        const user = await this.createUserCommand.execute({
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
    };

    public signIn = async (dto: SignInDto, meta: DeviceMetadata) => {
        const entities = await this.findUserCommand.execute({ email: dto.email });

        if (!entities?.user || !entities?.security) {
            throw new BaseException(
                {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Неверный email или пароль',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const { security, user } = entities;
        const isPasswordValid = await argon.verify(security.passwordHash, dto.password);

        if (!isPasswordValid) {
            throw new BaseException(
                {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Неверный email или пароль',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const { id } = await this.sessionRepo.create({
            userId: user.id,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            ...meta,
        });

        const { access, refresh } = await this.tokenService.generateTokens(user, id);

        return {
            success: true,
            tokens: {
                access,
                refresh,
            },
            message: 'Вы успешно вошли в систему',
        };
    };

    public refresh = async (token: string, metadata: DeviceMetadata) => {
        const payload = await this.tokenService.validateToken(token, 'refresh');

        if (!payload?.jti) {
            throw new BaseException(
                {
                    code: 'INVALID_TOKEN',
                    message: 'Сессия недействительна или истекла',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const session = await this.sessionRepo.findById(payload.jti);

        if (!session || session.isRevoked) {
            throw new BaseException(
                {
                    code: 'SESSION_REVOKED',
                    message: 'Ваша сессия была отозвана или завершена',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const { user } = await this.findUserCommand.execute({ id: session.userId });

        if (!user) {
            await this.sessionRepo.revoke(session.id);
            throw new BaseException(
                {
                    code: 'USER_NOT_FOUND',
                    message: 'Аккаунт пользователя не найден',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        await this.sessionRepo.revoke(session.id);

        const newSession = await this.sessionRepo.create({
            userId: user.id,
            ...metadata,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });

        const { access, refresh } = await this.tokenService.generateTokens(user, newSession.id);

        return {
            tokens: { access, refresh },
            success: true,
            message: 'Токены успешно обновлены',
        };
    };

    public signOut = async (token: string) => {
        const payload = await this.tokenService.validateToken(token, 'refresh');

        if (!payload?.jti) {
            throw new BaseException(
                {
                    code: 'SESSION_EXPIRED',
                    message: 'Сессия уже истекла',
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        const session = await this.sessionRepo.findById(payload.jti);

        if (session) {
            const isRevoked = await this.sessionRepo.revoke(session.id);

            if (!isRevoked) {
                throw new BaseException(
                    {
                        code: 'SIGNOUT_FAILED',
                        message: 'Не удалось завершить сессию на сервере. Попробуйте позже.',
                        details: [{ target: 'database', message: 'Session revocation failed' }],
                    },
                    HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
        }

        return { success: true, message: 'Успешно вышли из системы!' };
    };
}
