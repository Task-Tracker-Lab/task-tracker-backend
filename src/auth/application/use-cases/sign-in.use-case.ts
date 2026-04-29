import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { BaseException } from '@shared/error';
import { ISessionRepository } from '../../domain/repository';
import { TokenService } from '../../infrastructure/security';
import { DeviceMetadata } from '../../infrastructure/utils/get-device-meta';
import { SignInDto } from '../dtos';
import { FindUserQuery } from '@core/user';

@Injectable()
export class SignInUseCase {
    constructor(
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenService: TokenService,
        private readonly findUserQuery: FindUserQuery,
    ) {}

    async execute(dto: SignInDto, meta: DeviceMetadata) {
        const entities = await this.findUserQuery.execute({ email: dto.email });

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
    }
}
