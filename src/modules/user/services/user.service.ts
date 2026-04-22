import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import type { UpdateProfileDto } from '../dtos';
import { createId } from '@paralleldrive/cuid2';
import { IUserMedia, USER_MEDIA_TOKEN, type FileUploadDto } from '../../media';
import { BaseException } from '@shared/error';

@Injectable()
export class UserService {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
        @Inject(USER_MEDIA_TOKEN)
        private readonly mediaService: IUserMedia,
    ) {}

    private throwUserNotFound() {
        throw new BaseException(
            {
                code: 'USER_NOT_FOUND',
                message: 'Пользователь не найден в системе',
            },
            HttpStatus.NOT_FOUND,
        );
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
        try {
            const isUpdated = await this.userRepo.updateProfile(id, dto);

            if (!isUpdated) {
                throw new BaseException(
                    {
                        code: 'PROFILE_UPDATE_FAILED',
                        message: 'Не удалось обновить данные профиля',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            await this.userRepo.logActivity({
                id: createId(),
                userId: id,
                eventType: 'PROFILE_UPDATED',
            });

            return {
                success: true,
                message: 'Профиль успешно обновлен',
            };
        } catch (error) {
            if (error instanceof BaseException) {
                throw error;
            }

            throw new BaseException(
                {
                    code: 'PROFILE_SERVICE_ERROR',
                    message: 'Произошла ошибка при обновлении профиля',
                    details: [
                        {
                            reason:
                                error instanceof Error ? error.message : 'Unknown database error',
                        },
                    ],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
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

    public uploadAvatar = async (userId: string, fileDto: FileUploadDto) => {
        const { url } = await this.mediaService.uploadUserAvatar(userId, fileDto, (url) =>
            this.userRepo.updateAvatar(userId, url),
        );

        await this.userRepo.logActivity({
            id: createId(),
            userId,
            eventType: 'AVATAR_CHANGED',
            metadata: { url },
        });

        return {
            success: true,
            url,
        };
    };
}
