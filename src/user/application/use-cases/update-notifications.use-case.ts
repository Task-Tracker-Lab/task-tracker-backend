import { IUserRepository } from '@core/user/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';
import { UpdateNotificationsDto } from '../dtos';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class UpdateNotificationsUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(id: string, dto: UpdateNotificationsDto) {
        const user = await this.userRepo.findById(id);

        if (!user) {
            throw new BaseException(
                { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' },
                HttpStatus.NOT_FOUND,
            );
        }

        try {
            const isUpdated = await this.userRepo.updateNotifications(id, {
                email: dto.email,
                push: dto.push,
            });

            if (!isUpdated) {
                throw new BaseException(
                    {
                        code: 'NOTIFICATIONS_UPDATE_FAILED',
                        message: 'Не удалось обновить настройки уведомлений',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            await this.userRepo.logActivity({
                id: createId(),
                userId: id,
                eventType: 'NOTIFICATIONS_UPDATED',
            });

            return {
                success: true,
                message: 'Настройки уведомлений обновлены',
            };
        } catch (error) {
            if (error instanceof BaseException) throw error;

            throw new BaseException(
                {
                    code: 'USER_SETTINGS_ERROR',
                    message: 'Ошибка при сохранении настроек пользователя',
                    details: [
                        {
                            reason: error instanceof Error ? error.message : 'Database error',
                        },
                    ],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
