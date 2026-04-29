import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import Redis from 'ioredis';
import type { TeamInvite } from '../dtos/invitation.dto';

@Injectable()
export class AcceptInvitationUseCase {
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly USER_INVITES_KEY = (email: string) => `user:invites:${email.toLowerCase()}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
    ) {}

    async execute(code: string, userId: string, email: string) {
        const inviteRaw = await this.redis.get(this.INVITES_KEY(code));
        if (!inviteRaw) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'The invitation link has expired or is no longer valid.',
                },
                HttpStatus.GONE,
            );
        }

        const invite = JSON.parse(inviteRaw) as TeamInvite;
        if (invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new BaseException(
                {
                    code: 'INVITE_EMAIL_MISMATCH',
                    message: 'This invitation was sent to a different email address.',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const member = await this.teamsRepo.findMember(invite.teamId, userId);
        if (member) {
            if (member.status === 'banned') {
                throw new BaseException(
                    { code: 'MEMBER_BANNED', message: 'You are banned from this team.' },
                    HttpStatus.FORBIDDEN,
                );
            }
            if (member.status === 'active') {
                await this.cleanupInvite(code, invite.teamId, email);
                throw new BaseException(
                    { code: 'ALREADY_MEMBER', message: 'You are already a member of this team.' },
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        await this.teamsRepo.addMember({
            teamId: invite.teamId,
            userId,
            role: invite.role,
            status: 'active',
            joinedAt: new Date(),
        });

        const multi = this.redis.multi();
        multi.del(this.INVITES_KEY(code));
        multi.srem(this.TEAM_INVITES_KEY(invite.teamId), code);
        multi.srem(this.USER_INVITES_KEY(email.toLowerCase()), code);
        await multi.exec();

        return { success: true, message: 'Вы успешно присоединились к команде' };
    }

    private async cleanupInvite(code: string, teamId: string, email: string) {
        const multi = this.redis.multi();
        multi.del(this.INVITES_KEY(code));
        multi.srem(this.TEAM_INVITES_KEY(teamId), code);
        multi.srem(this.USER_INVITES_KEY(email.toLowerCase()), code);
        await multi.exec();
    }
}
