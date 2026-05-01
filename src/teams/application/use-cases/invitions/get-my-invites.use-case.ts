import { TeamMemberMapper } from '@core/teams/application/mappers';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class GetMyInvitesUseCase {
    constructor(
        @InjectRedis()
        private readonly redis: Redis,
    ) {}

    async execute(email: string) {
        const userKey = `user:invites:${email.toLowerCase()}`;
        const codes = await this.redis.smembers(userKey);

        if (!codes.length) return [];

        const inviteKeys = codes.map((c) => `inv:code:${c}`);
        const results = await this.redis.mget(inviteKeys);

        const { activeInvites, expiredCodes } = results.reduce(
            (acc, raw, i) => {
                if (raw) {
                    acc.activeInvites.push(TeamMemberMapper.toPublicInvite(raw, codes[i]));
                } else {
                    acc.expiredCodes.push(codes[i]);
                }
                return acc;
            },
            { activeInvites: [], expiredCodes: [] },
        );

        if (expiredCodes.length > 0) {
            this.redis.srem(userKey, ...expiredCodes).catch((err) => {
                console.error('Failed to cleanup expired invites:', err);
            });
        }

        return activeInvites;
    }
}
