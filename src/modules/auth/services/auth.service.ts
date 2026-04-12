import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import {
    PasswordResetConfirmDto,
    ResetPasswordDto,
    SignInDto,
    SignUpDto,
    VerifyDto,
    VerifyResetCodeDto,
} from '../dtos';
import { validate } from 'email-validator';
import { generate, generateSecret, verify as verifyOTP } from 'otplib';
import * as argon from 'argon2';
import { CreateUserCommand, FindOneUserCommand, UpdatePassUserCommand } from '../../user';
import { TokenService } from './token.service';
import { ISessionRepository } from '../repository';
import { DeviceMetadata } from '../helpers';
import { InjectQueue } from '@nestjs/bullmq';
import { Queues, RegisterCodeEvent } from 'src/shared/workers';
import type { Queue } from 'bullmq';
import { MailJobs } from 'src/shared/workers/enum';
import { ResetPasswordEvent } from 'src/shared/workers/events';

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
        private readonly updateUserPass: UpdatePassUserCommand,
    ) {}

    public signUp = async (dto: SignUpDto) => {
        const isValidEmail = validate(dto.email);

        if (!isValidEmail) {
            throw new UnprocessableEntityException({
                code: 'INVALID_EMAIL_FORMAT',
                message: 'Указанный email адрес имеет некорректный формат',
                details: { email: dto.email },
            });
        }

        const isExists = await this.findUserCommand.execute({ email: dto.email });

        if (isExists) {
            throw new ConflictException({
                code: 'USER_ALREADY_EXISTS',
                message: 'Email уже занят другим аккаунтом',
                details: { email: dto.email },
            });
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
            throw new BadRequestException({
                code: 'REGISTRATION_EXPIRED',
                message: 'Срок регистрации истек или email не найден. Попробуйте снова.',
            });
        }

        const userData = JSON.parse(cachedData);

        const verifyResult = await verifyOTP({
            token: dto.code,
            secret: userData.otp.secret,
            algorithm: 'sha256',
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        if (!verifyResult.valid) {
            throw new BadRequestException({
                code: 'INVALID_OTP',
                message: 'Неверный или истекший код подтверждения',
            });
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
        const user = await this.findUserCommand.execute({ email: dto.email });

        if (!user) {
            throw new UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: 'Неверный email или пароль',
            });
        }

        const isPasswordValid = await argon.verify(user.passwordHash, dto.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException({
                code: 'INVALID_CREDENTIALS',
                message: 'Неверный email или пароль',
            });
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

        if (!payload || !payload.jti) {
            throw new UnauthorizedException({
                code: 'INVALID_TOKEN',
                message: 'Сессия недействительна или истекла',
            });
        }

        const session = await this.sessionRepo.findById(payload.jti);

        if (!session || session.isRevoked) {
            throw new UnauthorizedException({
                code: 'SESSION_REVOKED',
                message: 'Ваша сессия была отозвана или завершена',
            });
        }

        const user = await this.findUserCommand.execute({ id: session.userId });

        if (!user) {
            await this.sessionRepo.revoke(session.id);
            throw new UnauthorizedException({
                code: 'USER_NOT_FOUND',
                message: 'Аккаунт пользователя не найден',
            });
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
            throw new UnauthorizedException({ code: 'SESSION_EXPIRED', message: 'Сессия истекла' });
        }

        const session = await this.sessionRepo.findById(payload.jti);

        if (!session) {
            throw new UnauthorizedException({
                code: 'SESSION_NOT_FOUND',
                message: 'Сессия не найдена',
            });
        }

        await this.sessionRepo.revoke(session.id);

        return { success: true, message: 'Успешно вышли из системы!' };
    };

    public resetPass = async (dto: ResetPasswordDto) => {
        const isValidEmail = validate(dto.email);

        if (!isValidEmail) {
            throw new UnprocessableEntityException({
                code: 'INVALID_EMAIL_FORMAT',
                message: 'Указанный email адрес имеет некорректный формат',
                details: { email: dto.email },
            });
        }

        const user = await this.findUserCommand.execute({ email: dto.email });

        if (!user) {
            throw new NotFoundException({
                code: 'USER_NOT_FOUND',
                message: 'Пользователь с таким email не найден',
                details: { email: dto.email },
            });
        }

        const secret = generateSecret();
        const token = await generate({
            secret,
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        const resetPayload = {
            email: user.email,
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
            throw new BadRequestException({
                code: 'RESET_SESSION_EXPIRED',
                message: 'Время подтверждения истекло или запрос не найден. Запросите код снова.',
            });
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
            throw new BadRequestException({
                code: 'INVALID_VERIFICATION_CODE',
                message: 'Неверный или истекший код подтверждения',
            });
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
            throw new BadRequestException({
                code: 'RESET_SESSION_NOT_FOUND',
                message: 'Сессия восстановления не найдена или истекла. Начните процесс заново.',
            });
        }

        const resetSession = JSON.parse(cachedData);

        if (!resetSession.isVerified) {
            throw new ForbiddenException({
                code: 'CODE_NOT_VERIFIED',
                message: 'Код подтверждения еще не был верифицирован.',
            });
        }

        const hashed = await argon.hash(dto.password);

        await this.updateUserPass.execute(dto.email, hashed);
        await this.redis.del(redisKey);

        return {
            success: true,
            message: 'Пароль успешно изменен. Теперь вы можете войти в аккаунт.',
        };
    };
}
