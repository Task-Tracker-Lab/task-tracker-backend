import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';
import { createPaginationSchema } from '@shared/schemas';

export const CreateTeamSchema = z.object({
    name: z.string().min(2).max(100).describe('Название команды, отображаемое в интерфейсе'),
    description: z
        .string()
        .max(500)
        .optional()
        .describe('Краткое описание деятельности или целей команды'),
    slug: z.string().optional().describe('Уникальная ссылка на изображение команду'),
    tags: z
        .array(z.string().toLowerCase())
        .optional()
        .refine((items) => !items || new Set(items).size === items.length, {
            message: 'Теги в списке не должны повторяться',
        })
        .describe('Список строковых названий тегов для классификации'),
});

export class CreateTeamDto extends createZodDto(CreateTeamSchema) {}
export class UpdateTeamDto extends createZodDto(
    CreateTeamSchema.partial().refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    }),
) {}

export const TagSchema = z.object({
    id: z.string().describe('Уникальный идентификатор тега (CUID2)'),
    name: z.string().min(1).max(50).describe('Название тега (например, "Backend", "Design")'),
});

export const SyncTagsSchema = z.object({
    tags: z
        .array(z.string())
        .min(1, 'Список тегов не может быть пустым')
        .max(15, 'Нельзя добавить более 15 тегов за раз')
        .describe(
            'Массив названий тегов для привязки к команде. Если тега нет в базе, он будет создан.',
        ),
});

const FindTagsQuerySchema = z.object({
    search: z.string().optional().describe('Поисковый запрос для фильтрации тегов по названию'),
    page: z.coerce.number().int().min(1).default(1).describe('Номер страницы (от 1)'),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe('Количество возвращаемых результатов (1-100)'),
});

export class TagResponse extends createZodDto(createPaginationSchema(TagSchema)) {}
export class SyncTagsDto extends createZodDto(SyncTagsSchema) {}
export class FindTagsQuery extends createZodDto(FindTagsQuerySchema) {}

export const CheckSlugResponseSchema = z.object({
    available: z
        .boolean()
        .describe('Флаг доступности: true — адрес свободен, false — уже занят или некорректен'),
});

export class CheckSlugResponse extends createZodDto(CheckSlugResponseSchema) {}

export const TeamPermissionsSchema = z.object({
    canEdit: z.boolean().describe('Разрешено ли редактировать настройки и профиль команды'),
    canDelete: z
        .boolean()
        .describe('Разрешено ли полностью удалить команду (только для владельца)'),
    canManageMembers: z.boolean().describe('Разрешено ли менять роли и исключать участников'),
    canInvite: z.boolean().describe('Разрешено ли приглашать новых участников'),
    isOwner: z.boolean().describe('Является ли текущий пользователь владельцем (Owner)'),
});

export const UserTeamSchema = z.object({
    id: z.string().uuid().describe('Уникальный ID команды'),
    name: z.string().describe('Название команды'),
    slug: z.string().describe('Уникальный URL-путь команды'),
    description: z.string().nullable().describe('Краткое описание команды'),
    avatarUrl: z.string().nullable().describe('URL изображения профиля команды'),
    role: z.string().describe('Системное название роли пользователя'),
    joinedAt: z.string().datetime().describe('Дата, когда пользователь вступил в команду'),
    permissions: TeamPermissionsSchema.describe('Объект прав доступа текущего пользователя'),
});

export class UserTeamResponse extends createZodDto(UserTeamSchema) {}
