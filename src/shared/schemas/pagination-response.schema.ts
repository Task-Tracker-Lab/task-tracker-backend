import { z } from 'zod/v4';

export const paginationResponseSchema = z.object({
    hasNextPage: z
        .boolean()
        .describe('Флаг наличия следующей страницы. True, если текущая страница не последняя.'),
    hasPrevPage: z
        .boolean()
        .describe('Флаг наличия предыдущей страницы. True, если текущая страница больше первой.'),
    total: z
        .number()
        .int()
        .nonnegative()
        .describe('Общее количество записей, соответствующих поисковому запросу/фильтрам.'),
    totalPages: z
        .number()
        .int()
        .nonnegative()
        .describe('Общее количество страниц, рассчитанное на основе limit.'),
    page: z.number().int().positive().describe('Номер текущей страницы (начиная с 1).'),
    limit: z.number().int().positive().describe('Количество элементов на одну страницу.'),
});

export const createPaginationSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
    return z.object({
        data: z.array(itemSchema),
        meta: paginationResponseSchema,
    });
};
