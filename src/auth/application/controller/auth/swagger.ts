import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
    ApiBadRequest,
    ApiConflict,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from '@shared/error';
import { SignInDto, SignUpDto, VerifyDto } from '../../dtos';
import { ActionResponse } from '@shared/dtos';

export const PostRegisterSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Регистрация нового пользователя',
            description: 'Создает пользователя, базовые настройки безопасности и уведомлений.',
        }),
        ApiBody({ type: SignUpDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Пользователь успешно зарегистрирован.',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Ошибка валидации данных (например, неверный формат email)'),
        ApiConflict('Пользователь с таким email уже существует'),
    );

export const PostLoginSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Вход в систему',
            description:
                'Возвращает Access/Refresh токены. Если у пользователя включена 2FA, вернет временный токен.',
        }),
        ApiBody({ type: SignInDto.Output }),
        ApiResponse({
            status: 200,
            description: 'Успешный вход.',
            schema: {
                example: {
                    success: true,
                    message: false,
                    token: 'eyJhbGciOiJIUzI1NiIsInR5c...',
                },
            },
        }),
        ApiBadRequest('Неверный формат email'),
        ApiUnauthorized('Неверный email или пароль'),
    );

export const PostRefreshSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновление токенов',
            description: 'Выдает новую пару Access и Refresh токенов.',
        }),
        ApiResponse({
            status: 200,
            description: 'Токены успешно обновлены.',
            schema: {
                example: {
                    success: true,
                    token: 'eyJhbGciOiJIUzI1NiIsInR5c...',
                    message: 'def50200508a1768c7e...',
                },
            },
        }),
        ApiBadRequest('Ошибка валидации (не передан refresh токен)'),
        ApiUnauthorized('Refresh токен недействителен, истек или отозван'),
    );

export const PostLogoutSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Выход из системы',
            description: 'Удаляет текущую сессию пользователя из Redis.',
        }),
        ApiResponse({ status: 200, description: 'Успешный выход.', type: ActionResponse.Output }),
        ApiUnauthorized(),
    );

export const PostSignUpConfirmSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Подтверждение регистрации по коду',
            description:
                'Проверяет OTP из письма, создаёт аккаунт, выдаёт access-токен в теле ответа и устанавливает refresh в httpOnly cookie.',
        }),
        ApiBody({ type: VerifyDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Аккаунт подтверждён, сессия создана.',
            schema: {
                example: {
                    success: true,
                    message: 'Аккаунт успешно подтвержден',
                    token: 'eyJhbGciOiJIUzI1NiIsInR5c...',
                },
            },
        }),
        ApiValidationError('Ошибка валидации (неверный формат email или длина кода)'),
        ApiBadRequest('Срок регистрации истёк или сессия не найдена'),
        ApiBadRequest('Неверный или истёкший код подтверждения'),
    );

export const GetSessionsSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить активные сессии',
            description: 'Возвращает список всех активных устройств/сессий пользователя.',
        }),
        ApiResponse({
            status: 200,
            description: 'Список сессий успешно получен.',
            schema: {
                example: [
                    {
                        id: 'clj1xyz990000abc1',
                        device: 'Chrome on macOS',
                        ip: '192.168.1.1',
                        lastActive: '2026-04-11T14:30:00.000Z',
                        isCurrent: true,
                    },
                ],
            },
        }),
        ApiUnauthorized(),
    );

export const DeleteSessionSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Завершить чужую сессию',
            description: 'Принудительно удаляет указанную сессию из Redis.',
        }),
        ApiParam({ name: 'cuid', description: 'ID сессии, которую нужно завершить' }),
        ApiResponse({ status: 200, description: 'Сессия успешно завершена.' }),
        ApiUnauthorized(),
        ApiForbidden(),
        ApiNotFound('Сессия не найдена или уже истекла'),
    );
