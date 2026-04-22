import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '@shared/types';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy, 'bearer') {
    constructor(cfg: ConfigService) {
        const audConstraint = cfg.getOrThrow('JWT_AUDIENCE');
        const audience = btoa(audConstraint);

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: cfg.get<string>('JWT_ACCESS_SECRET'),
            issuer: cfg.get<string>('JWT_ISSUER'),
            audience,
        });
    }

    validate(payload: JwtPayload) {
        return payload;
    }
}
