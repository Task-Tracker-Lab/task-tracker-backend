import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';
import type { UpdateMemberDto } from '../dtos';
import { TeamMemberMapper } from '../mappers';
import { BaseException } from '@shared/error';
import { ROLE_PRIORITY } from '@shared/constants';

@Injectable()
export class TeamMembersService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    public getMembers = async (slug: string) => {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: `Команда ${slug} не найдена`,
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const members = await this.teamsRepo.findMembers(team.id);
        return TeamMemberMapper.toList(members);
    };

    public updateMember = async (
        slug: string,
        currentUserId: string,
        targetUserId: string,
        dto: UpdateMemberDto,
    ) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: `Команда ${slug} не найдена`,
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!currentUser || !targetUser) {
            throw new BaseException(
                {
                    code: 'MEMBER_NOT_FOUND',
                    message: 'Участник не найден',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        if (ROLE_PRIORITY[currentUser.role] < ROLE_PRIORITY.admin) {
            throw new BaseException(
                {
                    code: 'ADMIN_ROLE_REQUIRED',
                    message: 'У вас нет прав на редактирование участников',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // Нельзя менять роль тому, кто выше тебя или равен тебе по весу
        if (
            currentUserId !== targetUserId &&
            ROLE_PRIORITY[currentUser.role] <= ROLE_PRIORITY[targetUser.role]
        ) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_RANK',
                    message: 'Вы не можете менять данные участника с равным или высшим рангом',
                    details: [{ currentRole: currentUser.role, targetRole: targetUser.role }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // Защита от потери овнера: нельзя разжаловать овнера в админа
        if (targetUser.role === 'owner' && dto.role && dto.role !== 'owner') {
            throw new BaseException(
                {
                    code: 'OWNER_PROTECTION_VIOLATION',
                    message:
                        'Нельзя изменить роль владельца через это меню. Используйте передачу прав.',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        // Нельзя назначить роль выше своей (Админ не может сделать кого-то Овнером)
        if (
            dto.role &&
            ROLE_PRIORITY[dto.role] >= ROLE_PRIORITY[currentUser.role] &&
            currentUser.role !== 'owner'
        ) {
            throw new BaseException(
                {
                    code: 'CANNOT_ASSIGN_HIGHER_ROLE',
                    message: 'Вы не можете назначить роль выше своей или равную своей',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        try {
            const result = await this.teamsRepo.updateMember(team.id, targetUserId, dto);
            return {
                success: result,
                message: `Данные участника команды "${team.name}" успешно обновлены`,
            };
        } catch (error) {
            throw new BaseException(
                {
                    code: 'MEMBER_UPDATE_FAILED',
                    message: 'Ошибка при обновлении данных участника',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    };

    public removeMember = async (slug: string, currentUserId: string, targetUserId: string) => {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: `Команда ${slug} не найдена`,
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const [currentUser, targetUser] = await Promise.all([
            this.teamsRepo.findMember(team.id, currentUserId),
            this.teamsRepo.findMember(team.id, targetUserId),
        ]);

        if (!targetUser) {
            throw new BaseException(
                { code: 'MEMBER_NOT_FOUND', message: 'Участник не найден' },
                HttpStatus.NOT_FOUND,
            );
        }
        if (!currentUser) {
            throw new BaseException(
                { code: 'NOT_A_TEAM_MEMBER', message: 'Вы не состоите в этой команде' },
                HttpStatus.FORBIDDEN,
            );
        }

        const isSelfRemoval = currentUserId === targetUserId;

        if (isSelfRemoval) {
            if (currentUser.role === 'owner') {
                throw new BaseException(
                    {
                        code: 'OWNER_CANNOT_LEAVE',
                        message:
                            'Владелец не может покинуть команду. Передайте права или удалите команду.',
                    },
                    HttpStatus.BAD_REQUEST,
                );
            }
        } else {
            const canKick = ROLE_PRIORITY[currentUser.role] > ROLE_PRIORITY[targetUser.role];
            const hasAuthority = ROLE_PRIORITY[currentUser.role] >= ROLE_PRIORITY.admin;

            if (!hasAuthority || !canKick) {
                throw new BaseException(
                    {
                        code: 'KICK_FORBIDDEN',
                        message: 'У вас недостаточно прав, чтобы исключить этого участника',
                        details: [
                            { reason: !hasAuthority ? 'Low authority' : 'Target rank too high' },
                        ],
                    },
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        try {
            const result = await this.teamsRepo.removeMember(team.id, targetUserId);
            return {
                success: result,
                message: isSelfRemoval
                    ? `Вы успешно покинули команду ${team.name}`
                    : `Участник успешно исключен из команды ${team.name}`,
            };
        } catch (error) {
            throw new BaseException(
                {
                    code: 'MEMBER_REMOVAL_FAILED',
                    message: 'Ошибка при удалении участника',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    };
}
