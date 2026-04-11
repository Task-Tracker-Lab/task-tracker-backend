import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async generateTokens(user: any, sessionId: string) {
        const domain = this.configService.get('DOMAIN');

        const payload = {
            jti: sessionId,
            sub: user.id,
            email: user.email,
            iss: btoa(domain),
            // TODO: ADD TO ENV GLOBAL
            aud: btoa('task-tracker-client'),
            role: user.role,
        };

        const [access, refresh] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get<any>('JWT_ACCESS_EXPIRES_IN'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<any>('JWT_REFRESH_EXPIRES_IN'),
            }),
        ]);

        return { access, refresh };
    }

    async validateToken(token: string, type: 'access' | 'refresh'): Promise<JwtPayload> {
        try {
            const secret =
                type === 'access'
                    ? this.configService.get('JWT_ACCESS_SECRET')
                    : this.configService.get('JWT_REFRESH_SECRET');

            return this.jwtService.verifyAsync(token, { secret });
        } catch (e) {
            return null;
        }
    }
}
