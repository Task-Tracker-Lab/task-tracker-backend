import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { generateSecret } from 'otplib';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { MailJobs, Queues } from '@shared/workers';
import { Queue } from 'bullmq';
import { TeamInvitationEvent } from '@shared/workers/events';
import { InviteMemberDto, UpdateInvitationDto } from '../dtos';
import { ConfigService } from '@nestjs/config';
import { BaseException } from '@shared/error';
import { TeamInvite } from '@core/modules/teams/dtos/invitation.dto';

@Injectable()
export class TeamInvitationsService {
    private readonly INVITE_TTL = 86400;
    private readonly INVITES_KEY = (code: string) => `inv:code:${code}`;
    private readonly TEAM_INVITES_KEY = (teamId: string) => `team:invites:${teamId}`;
    private readonly USER_INVITES_KEY = (email: string) => `user:invites:${email.toLowerCase()}`;

    private assertCanManageInvites = async (teamId: string, userId: string) => {
        const member = await this.teamsRepo.findMember(teamId, userId);
        if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'У вас нет прав управлять приглашениями в этой команде',
                },
                HttpStatus.FORBIDDEN,
            );
        }
        return member;
    };

    private parseInvite = (raw: string, code?: string) => {
        try {
            const invite = JSON.parse(raw) as TeamInvite;
            return code ? { code, ...invite } : invite;
        } catch {
            throw new BaseException(
                {
                    code: 'INVITE_DATA_CORRUPTED',
                    message: 'Данные приглашения повреждены',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    };

    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(Queues.MAIL)
        private readonly mailQueue: Queue,
        private readonly cfg: ConfigService,
    ) {}

    public getInvitations = async (slug: string, userId?: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (userId) {
            await this.assertCanManageInvites(team.id, userId);
        }

        const codes = await this.redis.smembers(this.TEAM_INVITES_KEY(team.id));
        if (!codes.length) return [];

        const keys = codes.map((c) => this.INVITES_KEY(c));
        const invitesRaw = await this.redis.mget(...keys);

        return invitesRaw
            .map((raw, idx) => {
                if (!raw) return null;
                return this.parseInvite(raw, codes[idx]);
            })
            .filter((v): v is TeamInvite => Boolean(v));
    };

    public getInvitation = async (slug: string, code: string, userId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        await this.assertCanManageInvites(team.id, userId);

        const raw = await this.redis.get(this.INVITES_KEY(code));
        if (!raw) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'Срок действия приглашения истек или код неверен',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = this.parseInvite(raw, code);
        if (invite.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'INVITE_NOT_FOUND',
                    message: 'Приглашение не найдено',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        return invite;
    };

    public updateInvitation = async (
        slug: string,
        code: string,
        userId: string,
        dto: UpdateInvitationDto,
    ) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        await this.assertCanManageInvites(team.id, userId);

        const key = this.INVITES_KEY(code);
        const raw = await this.redis.get(key);
        if (!raw) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'Срок действия приглашения истек или код неверен',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = this.parseInvite(raw);
        if (invite.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'INVITE_NOT_FOUND',
                    message: 'Приглашение не найдено',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const ttl = await this.redis.ttl(key);
        if (ttl === -2) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'Срок действия приглашения истек или код неверен',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        invite.role = dto.role;

        if (ttl > 0) {
            await this.redis.set(key, JSON.stringify(invite), 'EX', ttl);
        } else {
            await this.redis.set(key, JSON.stringify(invite));
        }

        return { code, ...invite };
    };

    public declineInvitation = async (slug: string, code: string, userId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        await this.assertCanManageInvites(team.id, userId);

        const raw = await this.redis.get(this.INVITES_KEY(code));
        if (!raw) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'Срок действия приглашения истек или код неверен',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const invite = this.parseInvite(raw);
        if (invite.teamId !== team.id) {
            throw new BaseException(
                {
                    code: 'INVITE_NOT_FOUND',
                    message: 'Приглашение не найдено',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        await this.removeInvitation(team.id, code, invite.email);

        return {
            success: true,
            message: 'Приглашение удалено',
        };
    };

    public removeInvitation = async (teamId: string, code: string, email: string) => {
        try {
            const multi = this.redis.multi();
            multi.del(this.INVITES_KEY(code));
            multi.srem(this.TEAM_INVITES_KEY(teamId), code);
            multi.srem(this.USER_INVITES_KEY(email.toLowerCase()), code);
            await multi.exec();
        } catch {
            throw new BaseException(
                {
                    code: 'REDIS_TRANSACTION_FAILED',
                    message: 'Не удалось удалить приглашение из системы',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        return { success: true };
    };

    public invite = async (slug: string, inviterId: string, dto: InviteMemberDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: 'Команда не найдена',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const inviter = await this.teamsRepo.findMember(team.id, inviterId);
        if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'У вас нет прав приглашать новых участников',
                },
                HttpStatus.FORBIDDEN,
            );
        }

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

        try {
            const multi = this.redis.multi();
            multi.set(this.INVITES_KEY(code), JSON.stringify(inviteData), 'EX', this.INVITE_TTL);
            multi.sadd(this.TEAM_INVITES_KEY(team.id), code);
            multi.sadd(this.USER_INVITES_KEY(dto.email.toLowerCase()), code);
            await multi.exec();
        } catch (error) {
            throw new BaseException(
                {
                    code: 'REDIS_TRANSACTION_FAILED',
                    message: 'Не удалось создать приглашение в системе',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const origins = this.cfg.get('CORS_ALLOWED_ORIGINS');
        const FRONTEND_URL = origins[0];

        const event = new TeamInvitationEvent(
            dto.email,
            team.name,
            `${FRONTEND_URL}/invites/accept?code=${code}`,
        );
        await this.mailQueue.add(MailJobs.SEND_TEAM_INVITATION, event, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });

        return {
            success: true,
            message: `Приглашение отправлено на ${dto.email}`,
            code,
        };
    };

    public acceptInvite = async (code: string, userId: string, email: string) => {
        const inviteRaw = await this.redis.get(this.INVITES_KEY(code));
        if (!inviteRaw) {
            throw new BaseException(
                {
                    code: 'INVITE_EXPIRED_OR_INVALID',
                    message: 'Срок действия приглашения истек или код неверен',
                },
                HttpStatus.GONE,
            );
        }

        const invite = this.parseInvite(inviteRaw);

        if (invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new BaseException(
                {
                    code: 'INVITE_EMAIL_MISMATCH',
                    message: 'Этот инвайт предназначен для другого почтового адреса',
                    details: [{ target: 'email', expected: invite.email, actual: email }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const member = await this.teamsRepo.findMember(invite.teamId, userId);

        if (member) {
            if (member.status === 'banned') {
                throw new BaseException(
                    {
                        code: 'MEMBER_BANNED',
                        message: 'Вы заблокированы в этой команде',
                    },
                    HttpStatus.FORBIDDEN,
                );
            }

            if (member.status === 'active') {
                throw new BaseException(
                    {
                        code: 'ALREADY_MEMBER',
                        message: 'Вы уже являетесь участником этой команды',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        }

        try {
            await this.teamsRepo.addMember({
                teamId: invite.teamId,
                userId,
                role: invite.role,
                status: 'active',
                joinedAt: new Date(),
            });

            await this.removeInvitation(invite.teamId, code, email);

            return {
                success: true,
                message: 'Вы успешно присоединились к команде',
            };
        } catch (error) {
            throw new BaseException(
                {
                    code: 'ACCEPT_INVITE_FAILED',
                    message: 'Ошибка при вступлении в команду',
                    details: [{ reason: error instanceof Error ? error.message : 'DB Error' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    };
}
