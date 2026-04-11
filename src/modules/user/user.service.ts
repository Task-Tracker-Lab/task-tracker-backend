import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from './repository/user.repository.interface';
import { UpdateNotificationsDto, UpdateProfileDto } from './dtos';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class UserService {
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

    public getProfile = async (id: string) => {
        const user = await this.userRepo.findProfile(id);
        if (!user) this.throwUserNotFound();
        return user;
    };

    public updateProfile = async (id: string, dto: UpdateProfileDto) => {
        const user = await this.userRepo.findById(id);
        if (!user) this.throwUserNotFound();

        const updatedUser = await this.userRepo.updateProfile(id, dto);

        await this.userRepo.logActivity({
            id: createId(),
            userId: id,
            eventType: 'PROFILE_UPDATED',
            metadata: { fields: Object.keys(dto) },
        });

        return {
            success: true,
            message: 'Профиль успешно обновлен',
            updatedAt: new Date().toISOString(),
            data: updatedUser,
        };
    };

    public updateNotifications = async (id: string, dto: UpdateNotificationsDto) => {
        const user = await this.userRepo.findById(id);

        if (!user) this.throwUserNotFound();

        const settings = await this.userRepo.updateNotifications(id, {
            email: dto.email,
            push: dto.push,
        });

        await this.userRepo.logActivity({
            id: createId(),
            userId: id,
            eventType: 'NOTIFICATIONS_UPDATED',
        });

        return {
            success: true,
            newSettings: settings,
        };
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

        return { avatarUrl, success: true };
    };
}
