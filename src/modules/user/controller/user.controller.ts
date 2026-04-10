import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { UserService } from '../user.service';
import { createId } from '@paralleldrive/cuid2';
import { GetMeSwagger } from './user.swagger';
import { ApiTags } from '@nestjs/swagger';
import { UpdateNotificationsDto, UpdateProfileDto } from '../dtos';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly facade: UserService) {}

    @Get('me')
    @GetMeSwagger()
    async getProfile() {
        return {
            id: createId(),
            fullName: 'Alexey Smirnov',
            email: 'alexey.smirnov@example.com',
            bio: 'Менеджер продукта с 5-летним опытом создания SaaS-платформ. Увлечён продуктивностью и чистым дизайном.',
            avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka',
            timezone: 'Europe/Moscow',
            language: 'ru',
            security: {
                is2faEnabled: true,
                lastPasswordChange: new Date('2023-10-24').toISOString(),
            },
            notifications: {
                email: { task_assigned: true, mentions: true, daily_summary: false },
                push: { task_assigned: true, reminders: true },
            },
        };
    }

    @Patch('me')
    async updateProfile(@Body() dto: UpdateProfileDto) {
        return {
            success: true,
            message: 'Profile updated successfully',
            updatedAt: new Date().toISOString(),
            data: dto,
        };
    }

    @Patch('me/notifications')
    async updateNotifications(@Body() settings: UpdateNotificationsDto) {
        return {
            success: true,
            newSettings: settings,
        };
    }

    @Get('me/activity')
    async getActivity(@Query('limit') limit: string) {
        return [
            {
                id: createId(),
                eventType: 'TASK_COMPLETED',
                description: 'Завершена задача "Обновить текст лендинга"',
                createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                metadata: { taskId: createId() },
            },
            {
                id: createId(),
                eventType: 'SECURITY_UPDATE',
                description: 'Вы изменили настройки пароля',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                metadata: null,
            },
            {
                id: createId(),
                eventType: 'COMMENT_ADDED',
                description: 'Вы прокомментировали "Проверка дизайн-системы"',
                createdAt: '2023-10-24T14:30:00Z',
                metadata: { taskId: createId() },
            },
            {
                id: createId(),
                eventType: 'AVATAR_UPLOADED',
                description: 'Вы загрузили новую фотографию профиля',
                createdAt: '2023-10-22T10:00:00Z',
                metadata: null,
            },
        ].slice(0, Number(limit) || 10);
    }

    @Post('me/avatar')
    async uploadAvatar() {
        return {
            avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka',
            success: true,
        };
    }
}
