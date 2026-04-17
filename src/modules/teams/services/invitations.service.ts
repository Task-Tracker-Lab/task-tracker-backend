import {
    BadRequestException,
    ForbiddenException,
    GoneException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { generateSecret } from 'otplib';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { MailJobs, Queues } from '@shared/workers';
import { Queue } from 'bullmq';
import { TeamInvitationEvent } from '@shared/workers/events';
import type { InviteMemberDto } from '../dtos';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TeamInvitationsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(Queues.MAIL)
        private readonly mailQueue: Queue,
        private readonly cfg: ConfigService,
    ) {}

    public invite = async (slug: string, inviterId: string, dto: InviteMemberDto) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) throw new NotFoundException('Команда не найдена');

        const inviter = await this.teamsRepo.findMember(team.id, inviterId);
        if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
            throw new ForbiddenException('У вас нет прав приглашать новых участников');
        }

        const code = generateSecret({ length: 8 });

        const INVITE_TTL = 86400;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + INVITE_TTL * 1000);

        const inviteData = {
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
        multi.set(`inv:code:${code}`, JSON.stringify(inviteData), 'EX', INVITE_TTL);
        multi.sadd(`team:invites:${team.id}`, code);
        multi.sadd(`user:invites:${dto.email}`, code);
        await multi.exec();

        const origins = this.cfg.get('CORS_ALLOWED_ORIGINS');
        const FRONTEND_URL = origins[0];

        /**
         * Человек кликает: ttopen.ru/invites/accept?code=...
         * Фронт видит, что токена нет -> Редирект на /signup?inviteCode=...
         * Юзер регистрируется.
         * После успешного входа фронт видит inviteCode в URL или стейте и автоматом завершает процесс вступления.
         */
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
        const inviteRaw = await this.redis.get(`inv:code:${code}`);
        if (!inviteRaw) {
            throw new GoneException('Срок действия приглашения истек или код неверен');
        }

        const invite = JSON.parse(inviteRaw);

        if (invite.email.toLowerCase() !== email.toLowerCase()) {
            throw new ForbiddenException('Этот инвайт предназначен для другого почтового адреса');
        }

        const member = await this.teamsRepo.findMember(invite.teamId, userId);

        if (member) {
            if (member.status === 'banned') {
                throw new ForbiddenException('Вы заблокированы в этой команде');
            }

            if (member.status === 'active') {
                throw new BadRequestException('Вы уже являетесь участником этой команды');
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
        multi.del(`inv:code:${code}`);
        multi.srem(`team:invites:${invite.teamId}`, code);
        multi.srem(`user:invites:${email}`, code);
        await multi.exec();

        return {
            success: true,
            message: 'Вы успешно присоединились к команде',
        };
    };
}
