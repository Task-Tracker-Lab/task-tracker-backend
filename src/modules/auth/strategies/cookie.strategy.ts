import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '@shared/types';
import { BaseException } from '@shared/error';

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
            throw new BaseException(
                {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Refresh токен невалиден или протух',
                    details: [{ target: 'auth', reason: 'Payload is missing or jti is invalid' }],
                },
                HttpStatus.UNAUTHORIZED,
            );
        }

        return payload;
    }
}
