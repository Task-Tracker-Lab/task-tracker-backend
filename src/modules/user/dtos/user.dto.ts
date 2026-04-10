import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

const NotificationsSchema = z
    .object({
        email: z.object({
            task_assigned: z.boolean().describe('Уведомление на почту при назначении задачи'),
            mentions: z.boolean().describe('Уведомление на почту при упоминании в комментариях'),
            daily_summary: z.boolean().describe('Ежедневная сводка задач на почту'),
        }),
        push: z.object({
            task_assigned: z.boolean().describe('Push-уведомление при назначении задачи'),
            reminders: z.boolean().describe('Push-уведомления о дедлайнах'),
        }),
    })
    .describe('Настройки уведомлений пользователя');

export const UpdateNotificationsSchema = NotificationsSchema.partial().describe(
    'Схема для частичного обновления настроек уведомлений',
);

export class UpdateNotificationsDto extends createZodDto(UpdateNotificationsSchema) {}

const SecuritySchema = z
    .object({
        is2faEnabled: z.boolean().describe('Статус двухфакторной аутентификации'),
        lastPasswordChange: z.string().datetime().describe('Дата последнего изменения пароля'),
    })
    .describe('Данные безопасности аккаунта');

export const UserSchema = z.object({
    id: z.string().cuid2().describe('Уникальный идентификатор пользователя (CUID2)'),
    fullName: z.string().min(2).max(255).describe('Полное имя пользователя'),
    email: z.string().email().describe('Электронная почта'),
    bio: z.string().max(1000).nullable().describe('Информация "О себе"'),
    avatarUrl: z.string().url().describe('Ссылка на аватарку пользователя'),
    timezone: z.string().describe('Временная зона пользователя (IANA формат)'),
    language: z.enum(['ru', 'en']).describe('Выбранный язык интерфейса'),
    security: SecuritySchema,
    notifications: NotificationsSchema,
});
export class UserResponse extends createZodDto(UserSchema) {}

export const UpdateProfileSchema = UserSchema.pick({
    fullName: true,
    bio: true,
    timezone: true,
    language: true,
})
    .partial()
    .describe('Схема для частичного обновления профиля');

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
