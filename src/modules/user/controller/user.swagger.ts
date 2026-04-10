import { ApiExtraModels, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserResponse } from '../dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiErrorResponse } from 'src/shared/error';

export const GetMeSwagger = () =>
    applyDecorators(
        ApiExtraModels(UserResponse.Output),
        ApiOperation({
            summary: 'Получить профиль текущего пользователя',
            description:
                'Возвращает полную структуру профиля, включая вложенные объекты безопасности и настроек.',
        }),
        ApiResponse({
            status: 200,
            description: 'Данные профиля успешно получены.',
            type: UserResponse.Output,
        }),
        ApiErrorResponse(400, 'VALIDATION_FAILED', 'Ошибка во входных данных', [
            { field: 'email', message: 'Некорректный формат почты', code: 'invalid_email' },
        ]),
        ApiErrorResponse(401, 'AUTH_REQUIRED', 'Сессия истекла или токен не валиден'),
        ApiErrorResponse(403, 'ACCESS_DENIED', 'У вас недостаточно прав для этого действия'),
        ApiErrorResponse(404, 'USER_NOT_FOUND', 'Пользователь не найден в базе данных'),
        ApiErrorResponse(
            500,
            'INTERNAL_SERVER_ERROR',
            'Произошла критическая ошибка на стороне сервера',
        ),
    );
