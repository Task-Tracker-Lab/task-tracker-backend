import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import { TeamInvite } from '../dtos/invitation.dto';

@Injectable()
export class GetInvitationsQuery {
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, userId?: string) {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: 'Команда не найдена' },
                HttpStatus.NOT_FOUND,
            );
        }

        if (userId) {
            const member = await this.teamsRepo.findMember(team.id, userId);
            if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
                throw new BaseException(
                    {
                        code: 'INSUFFICIENT_PERMISSIONS',
                        message: 'У вас нет прав управлять приглашениями',
                    },
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        const codes = await this.redis.smembers(this.TEAM_INVITES_KEY(team.id));
        if (!codes.length) return [];

        const keys = codes.map((c) => this.INVITES_KEY(c));
        const invitesRaw = await this.redis.mget(...keys);

        return invitesRaw
            .map((raw, idx) => {
                if (!raw) return null;
                try {
                    const invite = JSON.parse(raw) as TeamInvite;
                    return { code: codes[idx], ...invite };
                } catch {
                    return null;
                }
            })
            .filter((v): v is TeamInvite & { code: string } => v !== null);
    }
}
