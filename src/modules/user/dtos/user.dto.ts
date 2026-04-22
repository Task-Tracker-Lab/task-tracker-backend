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

export const UpdateNotificationsSchema = NotificationsSchema.partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    })
    .describe('Схема для частичного обновления настроек уведомлений');

export class UpdateNotificationsDto extends createZodDto(UpdateNotificationsSchema) {}

const SecuritySchema = z
    .object({
        is2faEnabled: z.boolean().describe('Статус двухфакторной аутентификации'),
        lastPasswordChange: z.string().datetime().describe('Дата последнего изменения пароля'),
    })
    .describe('Данные безопасности аккаунта');

const ProfileSchema = z.object({
    firstName: z.string().describe('Имя пользователя'),
    lastName: z.string().describe('Фамилия'),
    middleName: z.string().nullable().describe('Отчество'),
    bio: z.string().nullable().describe('О себе'),
    avatarUrl: z.string().url().nullable().describe('Ссылка на аватар в S3'),
    timezone: z.string().describe('Временная зона'),
    language: z.string().describe('Язык интерфейса'),
    createdAt: z.string().datetime().describe('Дата регистрации'),
    updatedAt: z.string().datetime().describe('Дата последнего обновления профиля'),
});

export const UserSchema = z.object({
    id: z.string().describe('Уникальный идентификатор (CUID/UUID)'),
    email: z.string().email().describe('Электронная почта'),
    profile: ProfileSchema,
    security: SecuritySchema,
    notifications: NotificationsSchema,
});

export class UserResponse extends createZodDto(UserSchema) {}

export const UpdateProfileSchema = z
    .object({
        firstName: z
            .string()
            .min(1, 'Имя не может быть пустым')
            .max(50, 'Имя слишком длинное')
            .optional(),
        lastName: z
            .string()
            .min(1, 'Фамилия не может быть пустой')
            .max(50, 'Фамилия слишком длинная')
            .optional(),
        middleName: z.string().max(50, 'Отчество слишком длинное').nullish(),
        bio: z.string().max(1000, 'О себе не более 1000 символов').nullish(),
        timezone: z.string().max(50).optional(),
        language: z
            .string()
            .length(2, 'Используйте формат ISO (например, "ru" или "en")')
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    })
    .describe('Схема для частичного обновления данных профиля');

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
