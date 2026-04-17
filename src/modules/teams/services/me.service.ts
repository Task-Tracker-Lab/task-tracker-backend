import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { TeamMemberMapper } from '../mappers';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class MeService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @InjectRedis()
        private readonly redis: Redis,
    ) {}

    public getMyInvites = async (email: string) => {
        const codes = await this.redis.smembers(`user:invites:${email}`);

        if (!codes.length) return [];

        const results = await this.redis.mget(codes.map((c) => `inv:code:${c}`));

        return results
            .map((raw, i) => TeamMemberMapper.toPublicInvite(raw, codes[i]))
            .filter(Boolean);
    };

    public getAll = async (userId: string, pagination: Record<string, string>) => {
        const teams = await this.teamsRepo.findByUser(userId, pagination);
        return teams.map((t) => TeamMemberMapper.toUserTeam(t));
    };
}
