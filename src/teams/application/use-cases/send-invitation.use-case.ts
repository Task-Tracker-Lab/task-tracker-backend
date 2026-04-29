import { TeamMailJobs, TeamQueues } from '@core/teams/domain/enums';
import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { InviteMemberDto } from '../dtos';
import { BaseException } from '@shared/error';
import { generateSecret } from 'otplib';
import { TeamInvite } from '../dtos/invitation.dto';
import { TeamInvitationEvent } from '@core/teams/domain/events';

@Injectable()
export class SendInvitationUseCase {
    private readonly INVITE_TTL = 86400;
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly USER_INVITES_KEY = (email: string) => `user:invites:${email.toLowerCase()}`;

    constructor(
        @Inject('ITeamsRepository') private readonly teamsRepo: ITeamsRepository,
        @InjectRedis() private readonly redis: Redis,
        @InjectQueue(TeamQueues.TEAM_MAIL) private readonly mailQueue: Queue,
        private readonly cfg: ConfigService,
    ) {}

    async execute(slug: string, inviterId: string, dto: InviteMemberDto) {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Team does not exist',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const inviter = await this.teamsRepo.findMember(team.id, inviterId);
        if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Only admins or owners can invite new members',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // TODO AVOID DUPLICATE INVITIONS

        const code = generateSecret({ length: 8 });
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.INVITE_TTL * 1000);

        const inviteData: TeamInvite = {
            teamId: team.id,
            teamName: team.name,
            teamAvatar: team.avatarUrl,
            email: dto.email,
            role: dto.role || 'member',
            inviterId,
            inviterName: inviter.firstName,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
        };

        const multi = this.redis.multi();
        multi.set(this.INVITES_KEY(code), JSON.stringify(inviteData), 'EX', this.INVITE_TTL);
        multi.sadd(this.TEAM_INVITES_KEY(team.id), code);
        multi.sadd(this.USER_INVITES_KEY(dto.email.toLowerCase()), code);
        await multi.exec();

        const origins = this.cfg.get('CORS_ALLOWED_ORIGINS');
        const FRONTEND_URL = origins[0];
        const event = new TeamInvitationEvent(
            dto.email,
            team.name,
            `${FRONTEND_URL}/invites/accept?code=${code}`,
        );

        await this.mailQueue.add(TeamMailJobs.SEND_TEAM_INVITATION, event, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
        });

        return { success: true, message: `Приглашение отправлено на ${dto.email}`, code };
    }
}
