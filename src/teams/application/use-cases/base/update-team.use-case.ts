import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { ITeamsRepository } from '../../../domain/repository';
import type { UpdateTeamDto } from '../../dtos';
import { BaseException } from '@shared/error';

@Injectable()
export class UpdateTeamUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string, userId: string, dto: UpdateTeamDto) {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team?.id) {
            throw new BaseException(
                {
                    code: 'TEAM_NOT_FOUND',
                    message: `Команда ${slug} не найдена`,
                },
                HttpStatus.NOT_FOUND,
            );
        }

        const member = await this.teamsRepo.findMember(team.id, userId);
        const canEdit = member?.role === 'admin' || member?.role === 'owner';

        if (!canEdit) {
            throw new BaseException(
                {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'У вас нет прав для редактирования этой команды',
                    details: [{ target: 'role', value: member?.role }],
                },
                HttpStatus.FORBIDDEN,
            );
        }

        const { tags, ...data } = dto;

        try {
            const result = await this.teamsRepo.update(team.id, data, tags);

            return {
                ...result,
                message: 'Данные команды успешно обновлены',
            };
        } catch (error) {
            if (error instanceof BaseException) throw error;

            throw new BaseException(
                {
                    code: 'TEAM_UPDATE_FAILED',
                    message: 'Ошибка при обновлении данных команды',
                    details: [{ reason: error instanceof Error ? error.message : 'Unknown error' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
