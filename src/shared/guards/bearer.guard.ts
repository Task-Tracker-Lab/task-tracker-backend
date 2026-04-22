import { type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@shared/decorators';
import { BaseException } from '@shared/error';
import type { JwtPayload } from '@shared/types';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class BearerAuthGuard extends AuthGuard('bearer') {
    constructor(private reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            return super.canActivate(context) as Promise<boolean>;
        } catch (e) {
            if (this.isPublicOrHasToken(context)) {
                return true;
            }

            throw e;
        }
    }

    handleRequest<TUser = JwtPayload>(
        err: unknown,
        user: TUser,
        info: unknown,
        context: ExecutionContext,
    ): TUser {
        if (user) {
            return user;
        }

        if (this.isPublicOrHasToken(context)) {
            return null;
        }

        throw new BaseException(
            {
                code: 'AUTH_FAILED',
                message: 'Доступ запрещен: требуется валидный токен авторизации',
                details: this.getAuthDetails(err, info),
            },
            HttpStatus.UNAUTHORIZED,
        );
    }

    private isPublicOrHasToken(context: ExecutionContext): boolean {
        const { query } = context
            .switchToHttp()
            .getRequest<FastifyRequest<{ Querystring: { token: string } }>>();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        return !!(isPublic || query.token);
    }

    private getAuthDetails(err: unknown, info: any) {
        const message = info?.message || (err instanceof Error ? err.message : null);

        return message ? [{ target: 'auth', reason: message }] : [];
    }
}
