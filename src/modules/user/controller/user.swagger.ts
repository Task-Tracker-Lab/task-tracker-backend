import {
    ApiBody,
    ApiConsumes,
    ApiExtraModels,
    ApiOperation,
    ApiQuery,
    ApiResponse,
} from '@nestjs/swagger';
import { UpdateNotificationsDto, UpdateProfileDto, UserResponse } from '../dtos';
import { applyDecorators } from '@nestjs/common';
import { ApiBadRequest, ApiRequireAuth, ApiValidationError } from 'src/shared/error';

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
        ApiRequireAuth(),
    );

export const PatchMeSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить данные профиля',
            description: 'Позволяет точечно обновить имя, bio, часовой пояс и язык интерфейса.',
        }),
        ApiBody({ type: UpdateProfileDto }),
        ApiResponse({
            status: 200,
            description: 'Профиль успешно обновлен.',
            schema: {
                example: {
                    success: true,
                    message: 'Профиль успешно обновлен.',
                    updatedAt: '2026-10-24T14:30:00.000Z',
                    data: {
                        fullName: 'Alexey Smirnov',
                        timezone: 'Europe/Moscow',
                    },
                },
            },
        }),
        ApiValidationError('Ошибка валидации (например, слишком короткое имя)', [
            {
                field: 'fullName',
                message: 'Строка должна содержать минимум 2 символа',
                code: 'too_small',
            },
        ]),
        ApiRequireAuth(),
    );

export const PatchMeNotificationsSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить настройки уведомлений',
            description: 'Частичное обновление настроек email и push уведомлений.',
        }),
        ApiBody({ type: UpdateNotificationsDto }),
        ApiResponse({
            status: 200,
            description: 'Настройки успешно сохранены.',
            schema: {
                example: {
                    success: true,
                    newSettings: {
                        email: { task_assigned: false },
                    },
                },
            },
        }),
        ApiValidationError('Некорректный формат настроек'),
        ApiRequireAuth(),
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
                example: [
                    {
                        id: 'clj1abc230000jk78',
                        eventType: 'TASK_COMPLETED',
                        description: 'Завершена задача "Обновить текст лендинга"',
                        createdAt: '2026-04-10T20:00:00.000Z',
                        metadata: { taskId: 'clj1xyz990000abc1' },
                    },
                ],
            },
        }),
        ApiRequireAuth(),
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
            schema: {
                example: {
                    avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=Aneka',
                    success: true,
                },
            },
        }),
        ApiBadRequest('Файл не передан или имеет неверный формат'),
        ApiRequireAuth(),
    );
