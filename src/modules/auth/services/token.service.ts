import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { JwtPayload } from '@shared/types';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly cfg: ConfigService,
    ) {}

    async generateTokens(user: any, sessionId: string) {
        const domain = this.cfg.get('DOMAIN');

        const payload = {
            jti: sessionId,
            sub: user.id,
            email: user.email,
            iss: btoa(domain),
            aud: btoa(this.cfg.getOrThrow('JWT_AUDIENCE')),
            role: user.role,
        };

        const [access, refresh] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.cfg.get('JWT_ACCESS_SECRET'),
                expiresIn: this.cfg.get<any>('JWT_ACCESS_EXPIRES_IN'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.cfg.get('JWT_REFRESH_SECRET'),
                expiresIn: this.cfg.get<any>('JWT_REFRESH_EXPIRES_IN'),
            }),
        ]);

        return { access, refresh };
    }

    async validateToken(token: string, type: 'access' | 'refresh'): Promise<JwtPayload> {
        try {
            const secret =
                type === 'access'
                    ? this.cfg.get('JWT_ACCESS_SECRET')
                    : this.cfg.get('JWT_REFRESH_SECRET');

            return this.jwtService.verifyAsync(token, { secret });
        } catch (e) {
            return null;
        }
    }
}
