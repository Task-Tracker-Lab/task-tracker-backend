import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { IUserRepository } from './repository/user.repository.interface';
import { UpdateNotificationsDto, UpdateProfileDto } from './dtos';
import { createId } from '@paralleldrive/cuid2';
import { S3Service } from '@libs/s3';

@Injectable()
export class UserService {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
        private readonly s3: S3Service,
    ) {}

    private throwUserNotFound() {
        throw new NotFoundException({
            code: 'USER_NOT_FOUND',
            message: 'Пользователь не найден в системе',
        });
    }

    public getProfile = async (userId: string) => {
        const { user, notifications, security } = await this.userRepo.findProfile(userId);
        if (!user) this.throwUserNotFound();
        const { id, email, ...profile } = user;

        return {
            id,
            email,
            profile,
            security,
            notifications,
        };
    };

    public updateProfile = async (id: string, dto: UpdateProfileDto) => {
        const keysToUpdate = Object.keys(dto);
        if (keysToUpdate.length === 0) {
            return {
                success: true,
                message: 'Изменений не обнаружено',
            };
        }

        try {
            const isUpdated = await this.userRepo.updateProfile(id, dto);

            if (!isUpdated) {
                throw new InternalServerErrorException('Не удалось обновить профиль');
            }

            await this.userRepo.logActivity({
                id: createId(),
                userId: id,
                eventType: 'PROFILE_UPDATED',
                metadata: {
                    fields: keysToUpdate,
                },
            });

            return {
                success: true,
                message: 'Профиль успешно обновлен',
            };
        } catch (error) {
            throw error;
        }
    };

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

    public getActivity = async (id: string, page: number, limit: number) => {
        const safeLimit = Math.min(limit, 50);
        const offset = (page - 1) * safeLimit;

        const { items, total } = await this.userRepo.findActivityByUser(id, {
            limit: safeLimit,
            offset,
        });

        return {
            items,
            meta: {
                total,
                page,
                limit: safeLimit,
                totalPages: Math.ceil(total / safeLimit),
            },
        };
    };

    public uploadAvatar = async (id: string, avatarUrl: string) => {
        try {
            new URL(avatarUrl);
        } catch {
            throw new BadRequestException({
                code: 'INVALID_AVATAR_URL',
                message: 'Предоставлен некорректный URL аватара',
            });
        }

        await this.userRepo.updateAvatar(id, avatarUrl);

        await this.userRepo.logActivity({
            id: createId(),
            userId: id,
            eventType: 'AVATAR_CHANGED',
            metadata: { url: avatarUrl },
        });

        return { success: true, message: '' };
    };
}
