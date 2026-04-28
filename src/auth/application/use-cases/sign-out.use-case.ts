import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import { ISessionRepository } from '../../domain/repository';
import { TokenService } from '../../infrastructure/security';

@Injectable()
export class SignOutUseCase {
    constructor(
        @Inject('ISessionRepository')
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenService: TokenService,
    ) {}

    async execute(token: string) {
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
    }
}
