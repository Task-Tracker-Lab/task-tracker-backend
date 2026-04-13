import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '../types';

@Injectable()
export class CookieStrategy extends PassportStrategy(Strategy, 'cookie') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: FastifyRequest) => {
                    return request?.cookies?.['refresh'];
                },
            ]),
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true,
        });
    }

    validate(_req: FastifyRequest, payload: JwtPayload) {
        if (!payload || !payload.jti) {
            throw new UnauthorizedException({
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh токен невалиден или протух',
            });
        }

        return payload;
    }
}
