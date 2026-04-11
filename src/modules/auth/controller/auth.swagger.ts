import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
    ApiBadRequest,
    ApiConflict,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from 'src/shared/error';
import { ChangePasswordDto, Confirm2FaDto, Disable2FaDto, SignInDto, SignUpDto } from '../dtos';

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
            schema: {
                example: {
                    success: true,
                    message: 'Регистрация прошла успешно',
                },
            },
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
                    require2fa: false,
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5c...',
                    refreshToken: 'def50200508a1768c7e...',
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
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5c...',
                    refreshToken: 'def50200508a1768c7e...',
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
        ApiResponse({ status: 200, description: 'Успешный выход.' }),
        ApiUnauthorized(),
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

export const DeleteTerminateSessionSwagger = () =>
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

export const PostChangePasswordSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Смена пароля',
            description: 'Требует текущий и новый пароль. Инвалидирует все остальные сессии.',
        }),
        ApiBody({ type: ChangePasswordDto }),
        ApiResponse({ status: 200, description: 'Пароль успешно изменен.' }),
        ApiBadRequest('Неверный старый пароль'),
        ApiUnauthorized(),
    );

export const PostEnable2faSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Генерация QR-кода для 2FA',
            description: 'Создает секрет и возвращает ссылку (otpauth) для Google Authenticator.',
        }),
        ApiResponse({
            status: 200,
            description: 'QR-код сгенерирован.',
            schema: {
                example: {
                    secret: 'JBSWY3DPEHPK3PXP',
                    qrCodeUrl:
                        'otpauth://totp/TaskTracker:alexey?secret=JBSWY3DPEHPK3PXP&issuer=TaskTracker',
                },
            },
        }),
        ApiUnauthorized(),
    );

export const PostDisable2faSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Подтверждение включения 2FA',
            description: 'Проверяет первый код из приложения для окончательной активации 2FA.',
        }),
        ApiBody({ type: Confirm2FaDto }),
        ApiResponse({ status: 200, description: 'Двухфакторная аутентификация успешно включена.' }),
        ApiBadRequest('Неверный код подтверждения'),
        ApiUnauthorized(),
    );

export const PostConfirm2faSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Отключение 2FA',
            description:
                'Отключает двухфакторную аутентификацию (требует подтверждения паролем или текущим кодом).',
        }),
        ApiBody({ type: Disable2FaDto }),
        ApiResponse({ status: 200, description: '2FA успешно отключена.' }),
        ApiBadRequest('Неверный код или пароль для отключения'),
        ApiUnauthorized(),
    );
