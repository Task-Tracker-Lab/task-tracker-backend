import { type ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { DatabaseError } from 'pg';
import { BaseException, IErrorOptions } from './exception';
import { DrizzleQueryError } from 'drizzle-orm';
import type { ZodError, ZodIssue } from 'zod/v4';
import { DATABASE_ERRORS } from './swagger';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private isDev = process.env.NODE_ENV === 'development';

    catch(exception: unknown, host: ArgumentsHost) {
        if (exception instanceof ZodValidationException) {
            return this.parseZodValidation(exception, host);
        }

        if (exception instanceof BaseException) {
            return this.parseHttp(exception, host);
        }

        if (exception instanceof DrizzleQueryError) {
            return this.parseDatabase(exception, host);
        }

        return this.handleUnknownError(exception, host);
    }

    private parseZodValidation = async (exception: ZodValidationException, host: ArgumentsHost) => {
        const { request, response } = this.getCtxBase(host);
        const status = exception.getStatus();

        const zodError = exception.getZodError() as ZodError;
        const issues: ZodIssue[] = zodError.issues || [];

        return response.status(status).send(
            this.formatErrorResponse(request, status, {
                code: 'VALIDATION_FAILED',
                message: 'Переданные данные не прошли валидацию',
                details: issues,
                stack: exception.stack,
            }),
        );
    };

    private parseDatabase = async (exception: DrizzleQueryError, host: ArgumentsHost) => {
        const { request, response } = this.getCtxBase(host);

        const error =
            exception.cause instanceof DatabaseError
                ? exception.cause
                : exception instanceof DatabaseError
                  ? exception
                  : null;

        let status = 500;
        let message = exception.message || 'Database operation failed';
        const errorCode = 'DATABASE_ERROR';

        if (error) {
            const mapping = DATABASE_ERRORS[error.code];
            if (mapping) {
                status = mapping.code;
                message = mapping.msg;
            }
        }

        return response.status(status).send(
            this.formatErrorResponse(request, status, {
                code: errorCode,
                message,
                details: error?.constraint ? [{ target: error.constraint }] : [],
                stack: exception.stack,
                service: 'postgres',
            }),
        );
    };

    private parseHttp = async (exception: BaseException, host: ArgumentsHost) => {
        const { request, response } = this.getCtxBase(host);
        const status = exception.getStatus();

        const error = exception.getResponse() as IErrorOptions;

        return response.status(status).send(
            this.formatErrorResponse(request, status, {
                code: error.code,
                message: error.message || exception.message,
                details: error.details || [],
                stack: exception.stack,
            }),
        );
    };

    private handleUnknownError(exception: any, host: ArgumentsHost) {
        const { request, response } = this.getCtxBase(host);
        const status = HttpStatus.INTERNAL_SERVER_ERROR;

        return response.status(status).send(
            this.formatErrorResponse(request, status, {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Произошла непредвиденная ошибка на сервере',
                details: [],
                stack: exception?.stack,
            }),
        );
    }

    private formatErrorResponse(
        request: FastifyRequest,
        status: number,
        data: { code: string; message: string; details: any[]; stack?: string; service?: string },
    ) {
        const requestId = request.id ?? request.headers['x-request-id'];

        return {
            success: false,
            error: {
                code: data.code,
                message: data.message,
                retryable: status >= 500,
            },
            details: data.details,
            meta: {
                service: data.service ?? 'gateway',
                request: {
                    requestId,
                    path: request.url,
                    method: request.method,
                    ip: request.ip,
                },
                timestamp: new Date().toISOString(),
                ...(this.isDev && {
                    debug: {
                        stack: data.stack,
                    },
                }),
            },
        };
    }

    private getCtxBase(host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        return {
            response: ctx.getResponse<FastifyReply>(),
            request: ctx.getRequest<FastifyRequest>(),
        };
    }
}
