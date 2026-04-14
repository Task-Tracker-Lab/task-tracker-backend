import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';
import { createPaginationSchema } from '../../../shared/schemas';

export const CreateTeamSchema = z.object({
    name: z.string().min(2).max(100).describe('Название команды, отображаемое в интерфейсе'),
    description: z
        .string()
        .max(500)
        .optional()
        .describe('Краткое описание деятельности или целей команды'),
    slug: z.string().optional().describe('Уникальная ссылка на изображение команду'),
    tags: z
        .array(z.string())
        .optional()
        .describe('Список строковых названий тегов для классификации'),
});

export class CreateTeamDto extends createZodDto(CreateTeamSchema) {}
export class UpdateTeamDto extends createZodDto(CreateTeamSchema.partial()) {}

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
