import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import { TeamInvite } from '../../dtos/invitation.dto';

@Injectable()
export class GetInvitationQuery {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, code: string, userId: string) {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: 'Команда не найдена' },
                HttpStatus.NOT_FOUND,
            );
        }

        const member = await this.teamsRepo.findMember(team.id, userId);
        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            throw new BaseException(
                { code: 'INSUFFICIENT_PERMISSIONS', message: 'У вас нет прав' },
                HttpStatus.FORBIDDEN,
            );
        }

        const raw = await this.redis.get(this.INVITES_KEY(code));
        if (!raw) {
            throw new BaseException(
                { code: 'INVITE_EXPIRED_OR_INVALID', message: 'Срок действия истек' },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = JSON.parse(raw) as TeamInvite;
        if (invite.teamId !== team.id) {
            throw new BaseException(
                { code: 'INVITE_NOT_FOUND', message: 'Приглашение не найдено' },
                HttpStatus.NOT_FOUND,
            );
        }

        return { code, ...invite };
    }
}
