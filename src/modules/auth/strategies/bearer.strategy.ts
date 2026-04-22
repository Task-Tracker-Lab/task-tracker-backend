import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '@shared/types';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy, 'bearer') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
            issuer: configService.get<string>('JWT_ISSUER'),
            audience: configService.get<string>('JWT_AUDIENCE'),
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
