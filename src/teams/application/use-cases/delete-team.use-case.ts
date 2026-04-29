import { ITeamsRepository } from '@core/teams/domain/repository';
import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class DeleteTeamUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string, userId: string) {
        // 1. Ищем команду по слагу
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

        // 2. Проверяем права (бизнес-логика удаления)
        // Владелец определяется либо через ownerId в таблице команд,
        // либо через роль 'owner' в таблице участников.
        const member = await this.teamsRepo.findMember(team.id, userId);
        const isOwner = team.ownerId === userId || member?.role === 'owner';

        if (!isOwner) {
            throw new BaseException(
                {
                    code: 'ONLY_OWNER_CAN_DELETE',
                    message: 'Только владелец может удалить команду',
                },
                HttpStatus.FORBIDDEN,
            );
        }

        // 3. Выполняем удаление
        try {
            const result = await this.teamsRepo.remove(team.id, userId);

            return {
                success: result,
                message: 'Команда успешно удалена',
            };
        } catch (error) {
            throw new BaseException(
                {
                    code: 'TEAM_DELETE_FAILED',
                    message: 'Не удалось удалить команду',
                    details: [{ reason: error instanceof Error ? error.message : 'Unknown error' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
