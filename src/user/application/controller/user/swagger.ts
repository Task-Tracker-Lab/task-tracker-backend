import {
    ApiBody,
    ApiConsumes,
    ApiExtraModels,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { UpdateProfileDto, UserResponse } from '../../dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiBadRequest, ApiUnauthorized, ApiValidationError } from '@shared/error';
import { ActionResponse } from '@shared/dtos';

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
        ApiUnauthorized(),
    );

export const PatchMeSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить данные профиля',
            description: 'Позволяет точечно обновить имя, bio, часовой пояс и язык интерфейса.',
        }),
        ApiBody({ type: UpdateProfileDto.Output }),
        ApiResponse({
            status: 200,
            description: 'Профиль успешно обновлен.',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Ошибка валидации (например, слишком короткое имя)', [
            {
                field: 'fullName',
                message: 'Строка должна содержать минимум 2 символа',
                code: 'too_small',
            },
        ]),
        ApiUnauthorized(),
    );

export const GetMeActivitySwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить ленту активности пользователя',
            description: 'Возвращает список последних действий пользователя (логи).',
        }),
        ApiQuery({
            name: 'limit',
            required: false,
            type: String,
            description: 'Количество записей для вывода (по умолчанию 10)',
            example: '15',
        }),
        ApiResponse({
            status: 200,
            description: 'Список активностей успешно получен.',
            schema: {
                example: {
                    data: [
                        {
                            id: 'clj1abc230000jk78',
                            eventType: 'TASK_COMPLETED',
                            description: 'Завершена задача "Обновить текст лендинга"',
                            createdAt: '2026-04-10T20:00:00.000Z',
                            metadata: { taskId: 'clj1xyz990000abc1' },
                        },
                    ],
                    meta: {
                        total: 45,
                        page: 1,
                        limit: 20,
                        totalPages: 3,
                    },
                },
            },
        }),
        ApiUnauthorized(),
    );

export const PostMeAvatarSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Загрузить новую аватарку',
            description: 'Загрузка файла изображения для профиля пользователя.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        ApiResponse({
            status: 201,
            description: 'Аватар успешно загружен.',
            type: ActionResponse.Output,
        }),
        ApiBadRequest('Файл не передан или имеет неверный формат'),
        ApiUnauthorized(),
    );
