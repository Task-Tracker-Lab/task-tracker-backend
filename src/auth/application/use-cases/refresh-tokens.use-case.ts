import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import { ISessionRepository } from '../../domain/repository';
import { TokenService } from '../../infrastructure/security';
import { DeviceMetadata } from '../../infrastructure/utils/get-device-meta';
import { FindUserQuery } from '@core/user';

@Injectable()
export class RefreshTokensUseCase {
    constructor(
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenService: TokenService,
        private readonly findUserQuery: FindUserQuery,
    ) {}

    async execute(token: string, metadata: DeviceMetadata) {
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

        const { user } = await this.findUserQuery.execute({ id: session.userId });

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
    }
}
