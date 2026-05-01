import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import type { TeamInvite } from '../../dtos/invitation.dto';

@Injectable()
export class GetInvitationQuery {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, code: string, userId: string, userEmail: string) {
        const team = await this.getTeamOrThrow(slug);
        const invite = await this.getInviteOrThrow(code);

        this.validateInviteOwnership(invite, team.id);
        await this.validateAccess(team.id, userId, userEmail, invite.email);

        return { code, ...invite };
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

    private async getInviteOrThrow(code: string) {
        const raw = await this.redis.get(this.INVITES_KEY(code));
        if (!raw)
            throw new BaseException(
                { code: 'INVITE_EXPIRED', message: 'Срок действия приглашения истек' },
                HttpStatus.NOT_FOUND,
            );
        return JSON.parse(raw) as TeamInvite;
    }

    private validateInviteOwnership(invite: TeamInvite, teamId: string) {
        if (invite.teamId !== teamId) {
            throw new BaseException(
                { code: 'INVITE_NOT_FOUND', message: 'Приглашение не найдено' },
                HttpStatus.NOT_FOUND,
            );
        }
    }

    private async validateAccess(
        teamId: string,
        userId: string,
        currentUserEmail: string,
        inviteEmail: string,
    ) {
        if (currentUserEmail.toLowerCase() === inviteEmail.toLowerCase()) return;

        const member = await this.teamsRepo.findMember(teamId, userId);
        if (member && (member.role === 'owner' || member.role === 'admin')) return;

        throw new BaseException(
            { code: 'INSUFFICIENT_PERMISSIONS', message: 'У вас нет прав просмотра' },
            HttpStatus.FORBIDDEN,
        );
    }
}
