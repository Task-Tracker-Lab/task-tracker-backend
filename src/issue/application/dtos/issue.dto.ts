import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

import {
    ActionResponseSchema,
    createSortingSchema,
    CursorQuerySchema,
} from '../../../shared/schemas';
import { ISSUE_TYPE_LIST, PRIORITY_LIST } from '../../domain/entities';

export const PriorityEnumSchema = z
    .enum(PRIORITY_LIST)
    .default('medium')
    .describe('Приоритет задачи: low, medium, high, critical');

export const IssueTypeEnumSchema = z
    .enum(ISSUE_TYPE_LIST)
    .default('task')
    .describe('Тип задачи: task, bug, epic');

const AssigneeInfoSchema = z.object({
    id: z.string().describe('ID пользователя'),
    name: z.string().describe('Отображаемое имя'),
    email: z.string().email().optional().describe('Email пользователя'),
    avatarUrl: z.string().url().nullable().optional().describe('URL аватара'),
});

const ParentInfoSchema = z.object({
    id: z.string().nullable().optional().describe('ID родительской задачи (для подзадач)'),
    title: z
        .string()
        .nullable()
        .optional()
        .describe('Заголовок родительской задачи (денормализованное поле для отображения)'),
});

export const IssueSchema = z.object({
    id: z.string().min(1, 'ID не может быть пустым').describe('Уникальный идентификатор задачи'),
    title: z
        .string()
        .min(1, 'Заголовок обязателен')
        .max(255, 'Заголовок не должен превышать 255 символов')
        .describe('Заголовок задачи (например: "Добавить экспорт в PDF")'),
    description: z
        .string()
        .nullable()
        .optional()
        .describe('Markdown-описание задачи, детали реализации'),
    descriptionHtml: z
        .string()
        .nullable()
        .optional()
        .describe('Markdown-описание задачи, детали реализации'),
    priority: PriorityEnumSchema.describe('Приоритет задачи'),
    type: IssueTypeEnumSchema.describe('Тип задачи'),
    areaId: z
        .string()
        .min(1, 'ID области обязателен')
        .describe('ID области, к которой привязана задача'),
    stateId: z
        .string()
        .nullable()
        .optional()
        .describe('ID текущего состояния (колонки). Null — задача без состояния'),
    position: z
        .number()
        .int('Позиция должна быть целым числом')
        .min(0, 'Позиция не может быть отрицательной')
        .default(0)
        .describe('Порядковый номер задачи внутри колонки (0 — первая/верхняя)'),
    assigneeId: z
        .string()
        .nullable()
        .optional()
        .describe('ID текущего исполнителя. Null — задача не назначена'),
    assignee: AssigneeInfoSchema.nullable().describe(
        'Текущий исполнитель задачи. Null — задача не назначена',
    ),
    reporterId: z.string().nullable().optional().describe('ID автора задачи. Null — не указан'),
    reporter: AssigneeInfoSchema.nullable()
        .optional()
        .describe('Автор задачи (кто создал). Null — не указан'),
    parentId: z
        .string()
        .nullable()
        .optional()
        .describe('ID родительской задачи (для подзадач). Null — задача верхнего уровня'),
    parent: ParentInfoSchema.nullable()
        .optional()
        .describe('Родительская задача. Null — задача верхнего уровня'),
    labels: z
        .array(z.string().max(50, 'Метка не должна превышать 50 символов'))
        .default([])
        .describe('Список текстовых меток для категоризации (например: ["backend", "auth"])'),
    storyPoints: z
        .number()
        .int('Story points должны быть целым числом')
        .min(0, 'Story points не могут быть отрицательными')
        .max(10000, 'Story points не могут быть больше 1000')
        .nullable()
        .optional()
        .describe('Оценка сложности в story points (для Scrum)'),
    dueDate: z
        .string()
        .datetime({ offset: true })
        .nullable()
        .optional()
        .describe('Крайний срок выполнения (ISO 8601). Null — без срока'),
    createdAt: z
        .string()
        .datetime({ offset: true })
        .describe('Дата и время создания задачи (ISO 8601 с таймзоной)'),
    updatedAt: z
        .string()
        .datetime({ offset: true })
        .describe('Дата и время последнего обновления задачи'),
    createdBy: z.string().nullable().optional().describe('ID пользователя, создавшего задачу'),
    deletedAt: z
        .string()
        .datetime({ offset: true })
        .nullable()
        .optional()
        .describe('Дата мягкого удаления (null — задача активна)'),
});

export const CreateIssueSchema = IssueSchema.omit({
    id: true,
    areaId: true,
    assignee: true,
    reporter: true,
    parent: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    deletedAt: true,
})
    .partial({
        description: true,
        descriptionHtml: true,
        priority: true,
        type: true,
        stateId: true,
        assigneeId: true,
        reporterId: true,
        parentId: true,
        labels: true,
        storyPoints: true,
        dueDate: true,
        position: true,
    })
    .describe('Схема для создания новой задачи');

export const CreateIssueResponseSchema = ActionResponseSchema.extend({
    id: z.string().describe('Уникальный идентификатор созданной задачи'),
});

export const UpdateIssueSchema = CreateIssueSchema.omit({
    position: true,
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    })
    .describe('Схема для обновления задачи');

export const MoveIssueSchema = z
    .object({
        targetAreaId: z
            .string()
            .optional()
            .describe(
                'Целевая область (если перемещаем между областями). Если не указана — остаётся текущая',
            ),
        targetStateId: z
            .string()
            .nullable()
            .optional()
            .describe('Целевое состояние (колонка). Null — убрать из состояния'),
        position: z
            .number()
            .int('Позиция должна быть целым числом')
            .min(0, 'Позиция не может быть отрицательной')
            .describe('Новая позиция в колонке (0 — первая/верхняя)'),
        prevIssuePosition: z
            .number()
            .int('Позиция должна быть целым числом')
            .min(0, 'Позиция не может быть отрицательной')
            .nullable()
            .describe('Позиция предидущей задачи в колонке'),
        nextIssuePosition: z
            .number()
            .int('Позиция должна быть целым числом')
            .min(0, 'Позиция не может быть отрицательной')
            .nullable()
            .describe('Позиция следующей задачи в колонке'),
    })
    .describe('Схема для перемещения задачи по доске или между областями');

export const AssignIssueSchema = z
    .object({
        assigneeId: z
            .string()
            .nullable()
            .describe('ID нового исполнителя. Null — снять текущего исполнителя'),
    })
    .describe('Схема для назначения/снятия исполнителя');

export class CreateIssueDto extends createZodDto(CreateIssueSchema) {}
export class UpdateIssueDto extends createZodDto(UpdateIssueSchema) {}
export class CreateIssueResponse extends createZodDto(CreateIssueResponseSchema) {}

export class MoveIssueDto extends createZodDto(MoveIssueSchema) {}
export class AssignIssueDto extends createZodDto(AssignIssueSchema) {}

export const IssueQuerySchema = z
    .object({
        slug: z.string().describe('Слаг проекта'),
        key: z.string().describe('Слаг области'),
    })

    .describe('Обязательные Query параметры для управления задачами');

export const IssueFiltersQuerySchema = IssueQuerySchema.extend({
    stateId: z.string().optional().describe('Фильтр по состоянию (колонке)'),
    assigneeId: z.string().optional().describe('Фильтр по исполнителю'),
    reporterId: z.string().optional().describe('Фильтр по автору'),
    priority: PriorityEnumSchema.optional().describe('Фильтр по приоритету'),
    type: IssueTypeEnumSchema.optional().describe('Фильтр по типу задачи'),
    parentId: z
        .string()
        .nullable()
        .optional()
        .describe('Фильтр по родителю (null — только задачи верхнего уровня)'),
    labels: z
        .string()
        .optional()
        .describe('Метки через запятую (AND — задача должна иметь все указанные)'),
})
    .extend(CursorQuerySchema.shape)
    .extend(createSortingSchema(['position', 'createdAt', 'priority']).shape)
    .describe('Query параметры для получения списка задач с фильтрацией');

export const IssuesSchema = z.array(IssueSchema);

export class IssueQueryDto extends createZodDto(IssueQuerySchema) {}
export class IssueFiltersQueryDto extends createZodDto(IssueFiltersQuerySchema) {}

export class IssueResponse extends createZodDto(IssueSchema) {}
export class IssuesResponse extends createZodDto(IssuesSchema) {}
