import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { GlobalErrorResponse } from './schema';
import { applyDecorators } from '@nestjs/common';

export const ApiErrorResponse = (
    status: number,
    bizCode: string,
    description: string,
    details?: { field: string; message: string; code: string }[],
) =>
    ApiResponse({
        status,
        description,
        schema: {
            allOf: [{ $ref: getSchemaPath(GlobalErrorResponse.Output) }],
            example: {
                code: bizCode,
                message: description,
                retryable: status >= 500,
                details: details || [],
                meta: {
                    requestId: 'req-clj1abc230000jk78',
                    timestamp: new Date().toISOString(),
                    path: '/api/v1/...',
                    method: 'POST',
                    service: 'main-backend',
                },
            },
        },
    });

export const ApiBadRequest = (description: string = 'Некорректный запрос') =>
    applyDecorators(ApiErrorResponse(400, 'BAD_REQUEST', description));

export const ApiUnauthorized = (description: string = 'Сессия истекла или токен не валиден') =>
    applyDecorators(ApiErrorResponse(401, 'AUTH_REQUIRED', description));

export const ApiForbidden = (description: string = 'У вас недостаточно прав для этого действия') =>
    applyDecorators(ApiErrorResponse(403, 'ACCESS_DENIED', description));

export const ApiNotFound = (description: string = 'Ресурс не найден') =>
    applyDecorators(ApiErrorResponse(404, 'NOT_FOUND', description));

export const ApiValidationError = (
    description: string = 'Ошибка валидации входных данных',
    fields: any[] = [],
) => applyDecorators(ApiErrorResponse(400, 'VALIDATION_FAILED', description, fields));

export const ApiConflict = (description: string = 'Ресурс уже существует') =>
    applyDecorators(ApiErrorResponse(409, 'CONFLICT', description));

export const DATABASE_ERRORS: Record<string, { code: number; msg: string }> = {
    '23505': { code: 409, msg: 'Запись с таким значением уже существует (дубликат).' },
    '23503': { code: 409, msg: 'Ошибка внешнего ключа: связанная запись не найдена.' },
    '22P02': { code: 400, msg: 'Неверный формат данных (например, некорректный UUID).' },
    '23514': { code: 400, msg: 'Нарушено ограничение проверки (check constraint).' },
    '23502': { code: 400, msg: 'Отсутствует обязательное поле.' },
    '08006': { code: 500, msg: 'Ошибка соединения с базой данных.' },
    '40001': { code: 500, msg: 'Конфликт транзакции. Пожалуйста, повторите попытку.' },
};
