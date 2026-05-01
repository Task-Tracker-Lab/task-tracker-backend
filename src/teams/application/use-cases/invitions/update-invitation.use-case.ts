import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { UpdateInvitationDto } from '../../dtos';
import { BaseException } from '@shared/error';
import { TeamInvite } from '../../dtos/invitation.dto';

@Injectable()
export class UpdateInvitationUseCase {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(slug: string, code: string, userId: string, dto: UpdateInvitationDto) {
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
                    message: 'У вас нет прав на редактирование приглашений в этой команде',
                    details: [{ requiredRoles: ['owner', 'admin'], currentRole: member?.role }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const key = this.INVITES_KEY(code);
        const [rawInvite, ttl] = await Promise.all([this.redis.get(key), this.redis.ttl(key)]);

        if (!rawInvite || ttl <= 0) {
            throw new BaseException(
                {
                    code: 'INVITE_NOT_FOUND_OR_EXPIRED',
                    message: 'Приглашение не найдено или его срок действия уже истек',
                    details: [{ code }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = JSON.parse(rawInvite) as TeamInvite;

        if (invite.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'INVITE_TEAM_MISMATCH',
                    message: 'Это приглашение принадлежит другой команде',
                    details: [{ inviteTeamId: invite.teamId, requestTeamId: team.id }],
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        invite.role = dto.role;

        if (ttl > 0) {
            await this.redis.set(key, JSON.stringify(invite), 'EX', ttl);
        } else {
            await this.redis.set(key, JSON.stringify(invite));
        }

        return {
            success: true,
            message: 'Приглашение успешно обновлено',
            details: { code, role: invite.role, email: invite.email },
        };
    }
}
