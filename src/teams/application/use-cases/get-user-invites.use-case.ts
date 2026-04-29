import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { TeamMemberMapper } from '@core/teams/application/mappers';

@Injectable()
export class GetUserInvitesUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
    ) {}

    async execute(email: string) {
        const codes = await this.redis.smembers(`user:invites:${email}`);

        if (!codes.length) return [];

        const results = await this.redis.mget(codes.map((c) => `inv:code:${c}`));

        return results
            .map((raw, i) => TeamMemberMapper.toPublicInvite(raw, codes[i]))
            .filter(Boolean);
    }
}
