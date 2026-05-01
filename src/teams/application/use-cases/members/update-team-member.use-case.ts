import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateMemberDto } from '../../dtos';
import { BaseException } from '@shared/error';
import { TeamMemberPolicy } from '@core/teams/domain/policy';
import { TeamRole } from '@shared/entities';

@Injectable()
export class UpdateTeamMemberUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
        private readonly teamMemberPolicy: TeamMemberPolicy,
    ) {}

    async execute(slug: string, currentUserId: string, targetUserId: string, dto: UpdateMemberDto) {
        if (currentUserId === targetUserId) {
            throw new BaseException(
                { code: 'SELF_EDIT_RESTRICTED', message: 'Вы не можете редактировать свои данные' },
                HttpStatus.BAD_REQUEST,
            );
        }

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

        const issuerRole = currentUser.role as TeamRole;
        const targetRole = targetUser.role as TeamRole;

        if (!this.teamMemberPolicy.canManage(issuerRole, targetRole)) {
            throw new BaseException(
                { code: 'INSUFFICIENT_RANK', message: 'Ваш ранг должен быть выше ранга цели' },
                HttpStatus.FORBIDDEN,
            );
        }

        if (dto.role) {
            if (!this.teamMemberPolicy.canAssignRole(issuerRole, targetRole, dto.role)) {
                throw new BaseException(
                    {
                        code: 'INVALID_ROLE_ASSIGNMENT',
                        message: 'У вас нет прав назначить выбранную роль',
                    },
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        if (dto.status) {
            if (!this.teamMemberPolicy.canChangeStatus(issuerRole, targetRole)) {
                throw new BaseException(
                    {
                        code: 'INVALID_STATUS_CHANGE',
                        message: 'Вы не можете менять статус этого участника',
                    },
                    HttpStatus.FORBIDDEN,
                );
            }
        }

        try {
            const result = await this.teamsRepo.updateMember(team.id, targetUserId, dto);
            return {
                success: result,
                message: `Данные участника команды ${team.name} успешно обновлены`,
            };
        } catch (error) {
            if (error instanceof BaseException) throw error;

            throw new BaseException(
                {
                    code: 'MEMBER_UPDATE_FAILED',
                    message: 'Ошибка при обновлении данных участника',
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
