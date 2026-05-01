import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';

@Injectable()
export class GetInvitationsQuery {
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, userId: string) {
        const team = await this.getTeamOrThrow(slug);
        await this.ensureAdminPermissions(team.id, userId);

        const teamKey = this.TEAM_INVITES_KEY(team.id);
        const codes = await this.redis.smembers(teamKey);
        if (!codes.length) return [];

        const results = await this.redis.mget(...codes.map(this.INVITES_KEY));

        const { active, expired } = results.reduce(
            (acc, raw, i) => {
                if (raw) {
                    acc.active.push({ code: codes[i], ...JSON.parse(raw) });
                } else {
                    acc.expired.push(codes[i]);
                }
                return acc;
            },
            { active: [], expired: [] },
        );

        if (expired.length > 0) {
            this.redis.srem(teamKey, ...expired).catch((e) => console.error('Cleanup error:', e));
        }

        return active;
    }

    private async getTeamOrThrow(slug: string) {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team)
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: 'Команда не найдена' },
                HttpStatus.NOT_FOUND,
            );
        return team;
    }

    private async ensureAdminPermissions(teamId: string, userId: string) {
        const member = await this.teamsRepo.findMember(teamId, userId);
        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            throw new BaseException(
                { code: 'INSUFFICIENT_PERMISSIONS', message: 'У вас нет прав' },
                HttpStatus.FORBIDDEN,
            );
        }
    }
}
