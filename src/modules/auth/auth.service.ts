import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        // private readonly jwtService: JwtService,
        // @Inject('IRedisService')
        // private readonly redisService: IRedisService,
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
