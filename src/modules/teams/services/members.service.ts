import {
    BadRequestException,
    ForbiddenException,
    GoneException,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import { ROLE_PRIORITY } from '../entities';
import { generateSecret } from 'otplib';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bullmq';
import { MailJobs, Queues } from '@shared/workers';
import { Queue } from 'bullmq';
import { TeamInvitationEvent } from '@shared/workers/events';
import type { InviteMemberDto, UpdateMemberDto } from '../dtos';
import { ConfigService } from '@nestjs/config';
import { TeamMemberMapper } from '../mappers';

@Injectable()
export class MembersService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        @InjectRedis()
        private readonly redis: Redis,
        @InjectQueue(Queues.MAIL)
        private readonly mailQueue: Queue,
        private readonly cfg: ConfigService,
    ) {}

    public getMembers = async (slug: string) => {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new NotFoundException(`Команда ${slug} не найдена`);
        }

        const members = await this.teamsRepo.findMembers(team.id);
        return TeamMemberMapper.toList(members);
    };

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

    public updateMember = async (
        slug: string,
        currentUserId: string,
        targetUserId: string,
        dto: UpdateMemberDto,
    ) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) throw new NotFoundException('Команда не найдена');

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!currentUser || !targetUser) throw new NotFoundException('Участник не найден');

        if (ROLE_PRIORITY[currentUser.role] < ROLE_PRIORITY.admin) {
            throw new ForbiddenException('У вас нет прав на редактирование участников');
        }

        // Нельзя менять роль тому, кто выше тебя или равен тебе по весу
        if (
            currentUserId !== targetUserId &&
            ROLE_PRIORITY[currentUser.role] <= ROLE_PRIORITY[targetUser.role]
        ) {
            throw new ForbiddenException(
                'Вы не можете менять данные участника с равным или высшим рангом',
            );
        }

        // Защита от потери овнера: нельзя разжаловать овнера в админа
        if (targetUser.role === 'owner' && dto.role && dto.role !== 'owner') {
            throw new BadRequestException(
                'Нельзя изменить роль владельца. Используйте процедуру передачи прав.',
            );
        }

        // Нельзя назначить роль выше своей (Админ не может сделать кого-то Овнером)
        if (
            dto.role &&
            ROLE_PRIORITY[dto.role] >= ROLE_PRIORITY[currentUser.role] &&
            currentUser.role !== 'owner'
        ) {
            throw new ForbiddenException('Вы не можете назначить роль выше своей');
        }

        const result = await this.teamsRepo.updateMember(team.id, targetUserId, dto);

        return {
            success: result,
            message: `Данные участника команды "${team.name}" успешно обновлены`,
        };
    };

    public removeMember = async (slug: string, currentUserId: string, targetUserId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) throw new NotFoundException('Команда не найдена');

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!targetUser) throw new NotFoundException('Участник не найден в этой команде');
        if (!currentUser) throw new ForbiddenException('Вы не состоите в этой команде');

        const isSelfRemoval = currentUserId === targetUserId;

        if (isSelfRemoval) {
            if (currentUser.role === 'owner') {
                throw new BadRequestException(
                    'Владелец не может покинуть команду. Передайте права или удалите команду.',
                );
            }
        } else {
            const canKick = ROLE_PRIORITY[currentUser.role] > ROLE_PRIORITY[targetUser.role];
            const hasAuthority = ROLE_PRIORITY[currentUser.role] >= ROLE_PRIORITY.admin;

            if (!hasAuthority || !canKick) {
                throw new ForbiddenException(
                    'У вас недостаточно прав, чтобы исключить этого участника',
                );
            }
        }

        const result = await this.teamsRepo.removeMember(team.id, targetUserId);

        return {
            success: result,
            message: isSelfRemoval
                ? `Вы успешно покинули команду ${team.name}`
                : `Участник успешно исключен из команды ${team.name}`,
        };
    };
}
