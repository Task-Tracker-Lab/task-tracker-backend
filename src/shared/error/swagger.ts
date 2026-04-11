import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { GlobalErrorResponse } from './schema';
import { applyDecorators } from '@nestjs/common';

export const ApiErrorResponse = (
    status: number,
    bizCode: string,
    description: string,
    details?: { field: string; message: string; code: string }[],
) => {
    return ApiResponse({
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
};

export const ApiBadRequest = (description: string = 'Некорректный запрос') =>
    applyDecorators(ApiErrorResponse(400, 'BAD_REQUEST', description));

export const ApiUnauthorized = (description: string = 'Сессия истекла или токен не валиден') =>
    applyDecorators(ApiErrorResponse(401, 'AUTH_REQUIRED', description));

export const ApiForbidden = () =>
    applyDecorators(
        ApiErrorResponse(403, 'ACCESS_DENIED', 'У вас недостаточно прав для этого действия'),
    );

export const ApiNotFound = (description: string = 'Ресурс не найден') =>
    applyDecorators(ApiErrorResponse(404, 'NOT_FOUND', description));

export const ApiValidationError = (
    description: string = 'Ошибка валидации входных данных',
    fields: any[] = [],
) => applyDecorators(ApiErrorResponse(400, 'VALIDATION_FAILED', description, fields));
