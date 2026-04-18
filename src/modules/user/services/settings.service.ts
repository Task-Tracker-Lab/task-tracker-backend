import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import type { UpdateNotificationsDto } from '../dtos';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class UserSettingsService {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
    ) {}

    private throwUserNotFound() {
        throw new NotFoundException({
            code: 'USER_NOT_FOUND',
            message: 'Пользователь не найден в системе',
        });
    }

    public updateNotifications = async (id: string, dto: UpdateNotificationsDto) => {
        const keysToUpdate = Object.keys(dto);
        if (keysToUpdate.length === 0) {
            return {
                success: true,
                message: 'Изменений не обнаружено',
            };
        }

        const user = await this.userRepo.findById(id);
        if (!user) this.throwUserNotFound();

        try {
            const isUpdated = await this.userRepo.updateNotifications(id, {
                email: dto.email,
                push: dto.push,
            });

            if (!isUpdated) {
                throw new InternalServerErrorException(
                    'Ошибка при сохранении настроек уведомлений',
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
            throw error;
        }
    };
}
