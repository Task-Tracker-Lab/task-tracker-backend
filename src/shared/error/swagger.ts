import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { GlobalErrorResponse } from './schema';

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
