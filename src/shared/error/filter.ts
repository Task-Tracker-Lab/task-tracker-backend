import {
    type ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

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

        const requestId = request.id ?? request.headers['x-request-id'];

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

        response.status(status).send(errorResponse);
    }
}
