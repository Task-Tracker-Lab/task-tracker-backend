import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ROLE_PRIORITY } from '@shared/constants';
import { BaseException } from '@shared/error';

@Injectable()
export class RemoveTeamMemberUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string, currentUserId: string, targetUserId: string) {
        const team = await this.teamsRepo.findBySlug(slug);
        if (!team) {
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: `Команда ${slug} не найдена` },
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
                    { code: 'OWNER_CANNOT_LEAVE', message: 'Владелец не может покинуть команду' },
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
                { code: 'MEMBER_REMOVAL_FAILED', message: 'Ошибка при удалении участника' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
