import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';

const ErrorDetailSchema = z
    .object({
        field: z.string().describe('Путь к полю в формате dot-notation (например, "user.email")'),
        message: z.string().describe('Человекочитаемое сообщение о конкретной ошибке в этом поле'),
        code: z
            .string()
            .describe(
                'Машиночитаемый код ошибки валидации (например, "invalid_email", "too_short")',
            ),
    })
    .describe('Детальная информация о конкретном нарушении в запросе');

const ErrorMetaSchema = z
    .object({
        requestId: z
            .string()
            .describe(
                'Уникальный ID запроса (Trace ID). Используется для поиска логов в Sentry/ELK/Kibana',
            ),
        timestamp: z
            .string()
            .datetime()
            .describe('Точное время возникновения ошибки в формате ISO 8601'),
        path: z.string().describe('URL-путь эндпоинта, который вернул ошибку'),
        method: z.string().describe('HTTP метод запроса (GET, POST, etc.)'),
        service: z
            .string()
            .optional()
            .describe(
                'Имя микросервиса, в котором произошел сбой (полезно для будущего масштабирования)',
            ),
    })
    .describe('Техническая мета-информация для мониторинга и отладки');

export const GlobalErrorSchema = z.object({
    code: z
        .string()
        .describe(
            'Уникальный бизнес-код ошибки (например, "INSUFFICIENT_FUNDS", "TEAM_NOT_FOUND")',
        ),
    message: z.string().describe('Краткое описание ошибки для пользователя или разработчика'),
    retryable: z
        .boolean()
        .describe(
            'Флаг, указывающий клиенту, есть ли смысл повторять запрос без изменений (например, при 503 или Lock Timeout)',
        ),
    details: z
        .array(ErrorDetailSchema)
        .optional()
        .describe('Список ошибок валидации (заполняется только для 400 ошибок)'),
    meta: ErrorMetaSchema,
});

export class GlobalErrorResponse extends createZodDto(GlobalErrorSchema) {}
