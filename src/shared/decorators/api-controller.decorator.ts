import { Controller, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from 'src/shared/error';
import { BearerAuthGuard } from '../guards';

export const ApiBaseController = (path: string, tag: string, hasJWTGuard?: boolean) => {
    const decorators = [
        ApiTags(tag),
        Controller(path),
        hasJWTGuard ? UseGuards(BearerAuthGuard) : null,
        ApiErrorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Произошла критическая ошибка на стороне сервера',
        ),
    ].filter(Boolean);

    return applyDecorators(...decorators);
};
