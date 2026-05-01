import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import type { TeamInvite } from '../../dtos/invitation.dto';

@Injectable()
export class DeclineInvitationUseCase {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly USER_INVITES_KEY = (email: string) => `user:invites:${email.toLowerCase()}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, code: string, userId: string, userEmail: string) {
        const team = await this.getTeamOrThrow(slug);
        const invite = await this.getInviteOrThrow(code);

        this.validateInviteOwnership(invite, team.id);

        await this.validateAccess(team.id, userId, userEmail, invite.email);

        await this.cleanupInvite(code, team.id, invite.email);

        return {
            success: true,
            message: 'Приглашение успешно удалено',
        };
    }

    private async validateAccess(
        teamId: string,
        userId: string,
        currentUserEmail: string,
        inviteEmail: string,
    ) {
        if (currentUserEmail.toLowerCase() === inviteEmail.toLowerCase()) {
            return;
        }

        const member = await this.teamsRepo.findMember(teamId, userId);
        if (member && (member.role === 'owner' || member.role === 'admin')) {
            return;
        }

        throw new BaseException(
            {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'У вас нет прав для отмены этого приглашения',
            },
            HttpStatus.FORBIDDEN,
        );
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
        const rawInvite = await this.redis.get(this.INVITES_KEY(code));
        if (!rawInvite) {
            throw new BaseException(
                { code: 'INVITE_NOT_FOUND', message: 'Приглашение не найдено' },
                HttpStatus.NOT_FOUND,
            );
        }
        return JSON.parse(rawInvite) as TeamInvite;
    }

    private validateInviteOwnership(invite: TeamInvite, teamId: string) {
        if (invite.teamId !== teamId) {
            throw new BaseException(
                { code: 'ACCESS_DENIED', message: 'Ошибка доступа' },
                HttpStatus.FORBIDDEN,
            );
        }
    }

    private async cleanupInvite(code: string, teamId: string, email: string) {
        await this.redis
            .multi()
            .del(this.INVITES_KEY(code))
            .srem(this.TEAM_INVITES_KEY(teamId), code)
            .srem(this.USER_INVITES_KEY(email), code)
            .exec();
    }
    ы;
}
