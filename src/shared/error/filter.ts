import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        // 1. Определяем статус
        let status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let details = [];
        let message = exception.message;
        let code = 'INTERNAL_ERROR';

        if (exception?.name === 'ZodValidationException') {
            status = 400;
            code = 'VALIDATION_FAILED';
            details = exception.getResponse()?.errors || [];
            message = 'Validation failed';
        } else if (exception instanceof HttpException) {
            const res = exception.getResponse() as any;
            code = res.code || 'HTTP_ERROR';
            details = res.details || [];
        }

        const requestId = request.headers['x-request-id'] || createId();

        const errorResponse = {
            code,
            message,
            retryable: status >= 500,
            details,
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
                path: request.url,
                method: request.method,
                service: 'main-api',
            },
        };

        response.status(status).json(errorResponse);
    }
}
