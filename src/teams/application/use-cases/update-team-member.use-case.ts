import { ITeamsRepository } from '@core/teams/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateMemberDto } from '../dtos';
import { BaseException } from '@shared/error';
import { ROLE_PRIORITY } from '@shared/constants';

@Injectable()
export class UpdateTeamMemberUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string, currentUserId: string, targetUserId: string, dto: UpdateMemberDto) {
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

        if (!currentUser || !targetUser) {
            throw new BaseException(
                { code: 'MEMBER_NOT_FOUND', message: 'Участник не найден' },
                HttpStatus.NOT_FOUND,
            );
        }

        // 1. Проверка минимальной роли для редактирования
        if (ROLE_PRIORITY[currentUser.role] < ROLE_PRIORITY.admin) {
            throw new BaseException(
                {
                    code: 'ADMIN_ROLE_REQUIRED',
                    message: 'У вас нет прав на редактирование участников',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // 2. Нельзя менять роль тому, кто выше или равен по весу
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

        // 3. Защита Owner
        if (targetUser.role === 'owner' && dto.role && dto.role !== 'owner') {
            throw new BaseException(
                {
                    code: 'OWNER_PROTECTION_VIOLATION',
                    message: 'Нельзя изменить роль владельца через это меню',
                },
                HttpStatus.BAD_REQUEST,
            );
        }

        // 4. Нельзя назначить роль выше своей
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
                { code: 'MEMBER_UPDATE_FAILED', message: 'Ошибка при обновлении данных участника' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
