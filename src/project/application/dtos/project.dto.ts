import { PROJECT_STATUSES, PROJECT_VISIBILITIES } from '@core/project/domain/entities';
import {
    createCursorResponseSchema,
    ActionResponseSchema,
    SearchFilterSchema,
    CursorQuerySchema,
} from '@shared/schemas';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

import { ProjectMemberRoleSchema } from './member.dto';
import { CreateProjectSettingsSchema, ProjectSettingsSchema } from './settings.dto';

export const ProjectStatusSchema = z.enum(PROJECT_STATUSES);
export const ProjectVisibilitySchema = z.enum(PROJECT_VISIBILITIES);
export const ProjectTypeSchema = z.enum(['team', 'personal']);

export const ProjectSchema = z.object({
    id: z.string().min(1, 'ID не может быть пустым').describe('Уникальный идентификатор проекта'),
    teamId: z.string().nullish().describe('ID команды (null для личных проектов)'),
    slug: z
        .string()
        .min(1, 'Slug обязателен')
        .max(100, 'Slug не должен превышать 100 символов')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug должен быть в формате kebab-case')
        .describe('URL-дружественный идентификатор проекта'),
    name: z
        .string()
        .min(1, 'Название проекта обязательно')
        .max(100, 'Название не должно превышать 100 символов')
        .describe('Отображаемое название проекта'),
    description: z.string().nullish().describe('Markdown-описание проекта, его целей и правил'),
    descriptionHtml: z.string().nullish().describe('Сгенерированный HTML из Markdown описания'),
    icon: z
        .string()
        .max(255, 'Иконка должна быть не длиннее 255 символов')
        .nullish()
        .describe('Emoji или иконка проекта (например: "🚀", "💼", "🎯")'),
    color: z
        .string()
        .regex(
            /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
            'Цвет должен быть в HEX формате (#RRGGBB или #RGB)',
        )
        .nullish()
        .describe('HEX-код цвета для визуального выделения проекта'),
    status: ProjectStatusSchema.default('active').describe('Текущий статус проекта'),
    // type: ProjectTypeSchema.default('team').describe('Тип проекта: командный или личный'),
    sequence: z
        .number()
        .int('Порядковый номер должен быть целым числом')
        .min(0, 'Порядковый номер не может быть отрицательным')
        .default(0)
        .describe('Порядок отображения проекта в списке (меньше число — выше)'),
    ownerId: z.string().nullish().describe('ID создателя/владельца проекта'),
    visibility: ProjectVisibilitySchema.default('public').describe(
        'Видимость проекта для участников команды',
    ),
    createdAt: z
        .string()
        .datetime({ offset: true })
        .describe('Дата и время создания проекта (ISO 8601)'),
    updatedAt: z
        .string()
        .datetime({ offset: true })
        .describe('Дата и время последнего обновления проекта'),
    deletedAt: z
        .string()
        .datetime({ offset: true })
        .nullish()
        .describe('Дата мягкого удаления (null — не удалено)'),
});

export const CreateProjectSchema = ProjectSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    ownerId: true,
})
    .partial({
        description: true,
        descriptionHtml: true,
        icon: true,
        color: true,
        sequence: true,
        visibility: true,
        slug: true,
    })
    .extend({
        settings: CreateProjectSettingsSchema.optional().describe('Настройки проекта'),
    })
    .describe('Схема для создания нового проекта');

const CreateProjectsResponseSchema = ActionResponseSchema.extend({
    slug: z.string().describe('Уникальный идентификатор проекта в системе'),
});

export const CheckSlugResponseSchema = z
    .object({
        available: z
            .boolean()
            .describe('Доступен ли slug. true — свободен, false — занят или невалидный'),
        reason: z
            .string()
            .nullish()
            .describe(
                'Причина недоступности. null если slug свободен. ' +
                    'Возможные значения: "Этот slug уже занят", ' +
                    '"Недопустимый формат. Только строчные латинские буквы, цифры и дефисы"',
            ),
    })
    .describe('Результат проверки доступности slug');

export const UpdateProjectSchema = CreateProjectSchema.partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    })
    .describe('Схема для обновления существующего проекта');

export const TransferProjectSchema = z
    .object({
        teamId: z.string().min(1, 'ID команды обязателен').describe('ID новой команды для проекта'),
    })
    .describe('Схема для переноса проекта в другую команду');

export const ProjectFilterSchema = z
    .object({
        status: ProjectStatusSchema.optional(),
        type: ProjectTypeSchema.optional(),
        visibility: ProjectVisibilitySchema.optional(),
        search: z.string().min(1).max(100).optional(),
        teamId: z.string().optional(),
    })
    .partial()
    .describe('Фильтры для списка проектов');

export const CreateShareTokenSchema = z.object({
    ttl: z
        .string()
        .datetime()
        .nullish()
        .describe('Дата истечения ссылки. Если не указана — ставится дефолт 3 месяца'),
});

export const CreateShareTokenResponseSchema = ActionResponseSchema.extend({
    payload: z.object({
        token: z.string().describe('Токен'),
        expiresAt: z
            .string()
            .datetime({ offset: true })
            .refine((val) => !isNaN(Date.parse(val)), {
                message: 'Строка не является валидной датой',
            })
            .describe("'Дата истечения ссылки. Если не была указана — ставится дефолт 3 месяца'"),
    }),
});

export const ProjectListItemSchema = z.object({
    id: z.string().describe('ID проекта'),
    slug: z.string().describe('Slug проекта (URL-идентификатор)'),
    name: z.string().describe('Название проекта'),
    description: z.string().nullable().describe('Описание проекта'),
    status: ProjectStatusSchema.default('active').describe('Текущий статус проекта'),
    color: z.string().describe('Цвет проекта'),
    icon: z.string().nullish().describe('Иконка проекта'),
    createdAt: z.string().datetime({ offset: true }).describe('Дата создания проекта'),
    role: ProjectMemberRoleSchema.describe('Роль текущего пользователя в проекте'),
});

export const ProjectListResponseSchema = createCursorResponseSchema(ProjectListItemSchema);

export const ProjectDetailResponseSchema = z.object({
    id: z.string().describe('ID проекта'),
    slug: z.string().describe('URL-идентификатор проекта'),
    name: z.string().describe('Название проекта'),
    status: ProjectStatusSchema.default('active').describe('Текущий статус проекта'),
    description: z.string().nullable().describe('Markdown-описание проекта'),
    descriptionHtml: z.string().nullish().describe('HTML из Markdown описания'),
    visuals: z
        .object({
            color: z.string().nullish().describe('Цвет проекта'),
            icon: z.string().nullish().optional().describe('Иконка проекта'),
        })
        .describe('Визуальные настройки'),
    meta: z.object({
        sequence: z.number().int().nonnegative().describe('Счётчик задач'),
        createdAt: z
            .string()
            .datetime({ offset: true })
            .refine((val) => !isNaN(Date.parse(val)), {
                message: 'Строка не является валидной датой',
            })
            .describe('Дата создания'),
        updatedAt: z
            .string()
            .datetime({ offset: true })
            .refine((val) => !isNaN(Date.parse(val)), {
                message: 'Строка не является валидной датой',
            })
            .describe('Дата обновления'),
    }),
    access: z
        .object({
            visibility: ProjectVisibilitySchema.default('public').describe(
                'Видимость проекта для участников команды',
            ),
            currentUserRole: z
                .enum(['owner', 'admin', 'member', 'viewer'])
                .describe('Роль текущего пользователя'),
            shareUrl: z.string().nullable().describe('Публичная ссылка для шаринга'),
        })
        .describe('Права доступа'),
    settings: ProjectSettingsSchema.omit({
        id: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
    }).describe('Настройки проекта'),
});

export const ProjectQuerySearch = z
    .object({ status: ProjectStatusSchema.optional() })
    .extend(CursorQuerySchema.shape)
    .extend(SearchFilterSchema.shape);

export class ProjectQuery extends createZodDto(ProjectQuerySearch) {}
export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}
export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) {}
export class CreateProjectResponse extends createZodDto(CreateProjectsResponseSchema) {}
export class CreateShareTokenDto extends createZodDto(CreateShareTokenSchema) {}
export class CreateShareTokenResponse extends createZodDto(CreateShareTokenResponseSchema) {}
export class ProjectListResponse extends createZodDto(ProjectListResponseSchema) {}
export class ProjectDetailResponse extends createZodDto(ProjectDetailResponseSchema) {}
export class CheckSlugResponse extends createZodDto(CheckSlugResponseSchema) {}
