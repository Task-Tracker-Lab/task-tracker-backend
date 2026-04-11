import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtPayload } from '../../modules/auth/types';

export const GetUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();

        const user = request.user as JwtPayload;

        if (!user) return null;

        return data ? user[data] : user;
    },
);

export const GetUserId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string | undefined => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const user = request.user as JwtPayload;

        return user?.sub;
    },
);
