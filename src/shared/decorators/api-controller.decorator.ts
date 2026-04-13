import { Controller, applyDecorators } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiErrorResponse } from 'src/shared/error';

export const ApiBaseController = (path: string, tag: string) => {
    return applyDecorators(
        ApiTags(tag),
        Controller(path),
        ApiErrorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Произошла критическая ошибка на стороне сервера',
        ),
    );
};
