import { TeamMemberPolicy } from '@core/teams/domain/policy';
import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import type { TeamRole } from '@shared/entities';
import { BaseException } from '@shared/error';

@Injectable()
export class RemoveTeamMemberUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        private readonly policy: TeamMemberPolicy,
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

        const canRemove = this.policy.canRemove(
            currentUser.role as TeamRole,
            targetUser.role as TeamRole,
            isSelfRemoval,
        );

        if (!canRemove) {
            const errorCode = isSelfRemoval ? 'OWNER_CANNOT_LEAVE' : 'KICK_FORBIDDEN';
            const errorMessage = isSelfRemoval
                ? 'Владелец не может покинуть команду без передачи прав'
                : 'У вас недостаточно прав, чтобы исключить этого участника';

            throw new BaseException(
                { code: errorCode, message: errorMessage },
                HttpStatus.FORBIDDEN,
            );
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
            if (error instanceof BaseException) throw error;

            throw new BaseException(
                { code: 'MEMBER_REMOVAL_FAILED', message: 'Ошибка при удалении участника' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
