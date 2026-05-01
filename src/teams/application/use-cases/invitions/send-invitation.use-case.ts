import { TeamMailJobs, TeamQueues } from '@core/teams/domain/enums';
import { ITeamsRepository } from '@core/teams/domain/repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { InviteMemberDto } from '../../dtos';
import { BaseException } from '@shared/error';
import { generateSecret } from 'otplib';
import type { TeamInvite } from '../../dtos/invitation.dto';
import { TeamInvitationEvent } from '@core/teams/domain/events';
import { TeamMemberPolicy } from '@core/teams/domain/policy';
import type { TeamRole } from '@shared/entities';

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
        private readonly policy: TeamMemberPolicy,
    ) {}

    async execute(slug: string, inviterId: string, dto: InviteMemberDto) {
        const team = await this.getTeamOrThrow(slug);
        const inviter = await this.getInviterOrThrow(team.id, inviterId);

        this.validatePermissions(inviter.role as TeamRole, dto.role as TeamRole);
        await this.ensureNotAlreadyMember(team.id, dto.email);
        await this.ensureNoPendingInvite(team.id, dto.email);

        const code = generateSecret({ length: 8 });
        const inviteData = this.buildInviteData(team, inviter, dto);

        await this.saveInviteToCache(code, inviteData);

        await this.sendEmailNotification(code, team.name, dto.email);

        return { success: true, message: `Приглашение отправлено на ${dto.email.toLowerCase()}` };
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

    private async getInviterOrThrow(teamId: string, userId: string) {
        const inviter = await this.teamsRepo.findMember(teamId, userId);
        if (!inviter)
            throw new BaseException(
                { code: 'NOT_A_MEMBER', message: 'Вы не член команды' },
                HttpStatus.FORBIDDEN,
            );
        return inviter;
    }

    private validatePermissions(inviterRole: TeamRole, targetRole: TeamRole) {
        if (!this.policy.canInvite(inviterRole, targetRole || 'member')) {
            throw new BaseException(
                { code: 'INSUFFICIENT_PERMISSIONS', message: 'Недостаточно прав' },
                HttpStatus.FORBIDDEN,
            );
        }
    }

    private async ensureNotAlreadyMember(teamId: string, email: string) {
        const member = await this.teamsRepo.findMember(teamId, email); // Тут лучше искать по email в репо
        if (member)
            throw new BaseException(
                { code: 'ALREADY_MEMBER', message: 'Уже в команде' },
                HttpStatus.BAD_REQUEST,
            );
    }

    private async ensureNoPendingInvite(teamId: string, email: string) {
        const activeCodes = await this.redis.smembers(this.USER_INVITES_KEY(email));
        if (activeCodes.length === 0) return;

        const invitesData = await this.redis.mget(activeCodes.map(this.INVITES_KEY));
        const hasDuplicate = invitesData
            .filter((d): d is string => !!d)
            .map((d) => JSON.parse(d) as TeamInvite)
            .some((i) => i.teamId === teamId);

        if (hasDuplicate) {
            throw new BaseException(
                { code: 'INVITATION_ALREADY_SENT', message: 'Приглашение уже в пути' },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    private buildInviteData(team: any, inviter: any, dto: InviteMemberDto): TeamInvite {
        const expiresAt = new Date(Date.now() + this.INVITE_TTL * 1000);
        return {
            teamId: team.id,
            teamName: team.name,
            teamAvatar: team.avatarUrl,
            email: dto.email.toLowerCase(),
            role: (dto.role || 'member') as TeamRole,
            inviterId: inviter.userId,
            inviterName: inviter.firstName,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
        };
    }

    private async saveInviteToCache(code: string, data: TeamInvite) {
        await this.redis
            .multi()
            .set(this.INVITES_KEY(code), JSON.stringify(data), 'EX', this.INVITE_TTL)
            .sadd(this.TEAM_INVITES_KEY(data.teamId), code)
            .sadd(this.USER_INVITES_KEY(data.email), code)
            .exec();
    }

    private async sendEmailNotification(code: string, teamName: string, email: string) {
        const origins = this.cfg.get<string[]>('CORS_ALLOWED_ORIGINS') || [];
        const url = `${origins[0]}/invites/accept?code=${code}`;
        const event = new TeamInvitationEvent(email, teamName, url);

        await this.mailQueue.add(TeamMailJobs.SEND_TEAM_INVITATION, event, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
        });
    }
}
