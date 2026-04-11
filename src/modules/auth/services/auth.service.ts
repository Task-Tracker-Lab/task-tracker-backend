import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { SignInDto, SignUpDto, VerifyDto } from '../dtos';
import { validate } from 'email-validator';
import { generate, generateSecret, verify as verifyOTP } from 'otplib';
import * as argon from 'argon2';
import { CreateUserCommand, FindOneUserCommand } from '../../user';
import { TokenService } from './token.service';
import { ISessionRepository } from '../repository';
import { DeviceMetadata } from '../helpers';

@Injectable()
export class AuthService {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenService: TokenService,
        private readonly findUserCommand: FindOneUserCommand,
        private readonly createUserCommand: CreateUserCommand,
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

        const isExists = await this.findUserCommand.execute(dto.email);

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

        console.log(data);

        await this.redis.set(`reg:${dto.email}`, JSON.stringify(data), 'EX', 900);

        // this.mailService.sendOtp(dto.email, otp);

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

        const isValid = await verifyOTP({
            token: dto.code,
            secret: userData.otp.secret,
            algorithm: 'sha256',
            digits: 6,
            period: 900,
            strategy: 'totp',
        });

        if (!isValid) {
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
            expiresAt: new Date(),
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

    public sigIn = async (dto: SignInDto, meta: DeviceMetadata) => {
        const user = await this.findUserCommand.execute(dto.email);

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
            expiresAt: new Date(),
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

    public refresh = async () => {};
}
