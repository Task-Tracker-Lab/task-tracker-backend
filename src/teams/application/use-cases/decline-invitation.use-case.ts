import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import { TeamInvite } from '../dtos/invitation.dto';

@Injectable()
export class DeclineInvitationUseCase {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly USER_INVITES_KEY = (email: string) => `user:invites:${email.toLowerCase()}`;

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
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Только администраторы могут удалять приглашения',
                    details: [{ userId }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const rawInvite = await this.redis.get(this.INVITES_KEY(code));
        if (!rawInvite) {
            throw new BaseException(
                {
                    code: 'INVITE_ALREADY_REMOVED',
                    message: 'Приглашение не найдено (возможно, оно уже было принято или удалено)',
                    details: [{ code }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = JSON.parse(rawInvite) as TeamInvite;
        if (invite.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'ACCESS_DENIED',
                    message: 'Вы не можете удалить приглашение чужой команды',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        try {
            const multi = this.redis.multi();
            multi.del(this.INVITES_KEY(code));
            multi.srem(this.TEAM_INVITES_KEY(team.id), code);
            multi.srem(this.USER_INVITES_KEY(invite.email), code);
            await multi.exec();
        } catch (err) {
            if (err instanceof BaseException) {
                throw err;
            }

            throw new BaseException(
                {
                    code: 'INFRASTRUCTURE_ERROR',
                    message: 'Не удалось корректно удалить приглашение из системы',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return {
            success: true,
            message: 'Приглашение отозвано администратором',
        };
    }
}
