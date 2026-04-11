import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
        private readonly userService: UserService,
        // private readonly jwtService: JwtService,
        // private readonly emailService: EmailService,
    ) {}

    async register() {}

    async login() {}

    async refresh() {}

    async logout() {}

    async getSessions() {}

    async terminateSession() {}

    async changePassword() {}

    async enable2fa() {}

    async disable2fa() {}

    async confirm2fa() {}
}
