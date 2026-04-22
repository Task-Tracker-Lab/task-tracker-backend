import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BaseException } from '@shared/error';
import type { JwtPayload } from '@shared/types';

@Injectable()
export class CookieAuthGuard extends AuthGuard('cookie') {
    handleRequest<TUser = JwtPayload>(err: unknown, user: TUser, info: any): TUser {
        if (err || !user) {
            throw new BaseException(
                {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Refresh токен невалиден или отсутствует',
                    details: [
                        {
                            target: 'auth',
                            reason: info?.message || 'Token verification failed',
                        },
                    ],
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        return user;
    }
}
