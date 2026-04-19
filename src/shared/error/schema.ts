import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ErrorDetailSchema = z.object({
    field: z.string().describe('Путь к полю (например, "user.email")'),
    message: z.string().describe('Сообщение об ошибке'),
    code: z.string().describe('Машиночитаемый код (например, "too_short")'),
});

const ErrorMetaSchema = z.object({
    service: z.string().default('gateway').describe('Имя микросервиса'),
    request: z.object({
        requestId: z.string().describe('Trace ID для логов'),
        path: z.string().describe('URL эндпоинта'),
        method: z.string().describe('HTTP метод'),
        ip: z.string().optional().describe('IP клиента'),
    }),
    timestamp: z.string().datetime().describe('Время ошибки ISO 8601'),
    debug: z
        .object({
            stack: z.string().optional().describe('Стек вызовов (только в Dev)'),
        })
        .optional(),
});

export const GlobalErrorSchema = z.object({
    success: z.literal(false).default(false),
    error: z.object({
        code: z.string().describe('Бизнес-код ошибки'),
        message: z.string().describe('Описание для пользователя'),
        retryable: z.boolean().describe('Флаг возможности повтора'),
    }),
    details: z.array(ErrorDetailSchema).optional(),
    meta: ErrorMetaSchema,
});

export class GlobalErrorResponse extends createZodDto(GlobalErrorSchema) {}
