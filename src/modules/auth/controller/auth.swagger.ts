import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
    ApiBadRequest,
    ApiConflict,
    ApiErrorResponse,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from 'src/shared/error';
import {
    ChangePasswordDto,
    Confirm2FaDto,
    Disable2FaDto,
    PasswordResetConfirmDto,
    ResetPasswordDto,
    SignInDto,
    SignUpDto,
    VerifyDto,
    VerifyResetCodeDto,
} from '../dtos';
import { ActionResponse } from 'src/shared/dtos';

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

export const PostPasswordResetSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Запрос кода восстановления пароля',
            description: 'Отправляет одноразовый код на email, если пользователь существует.',
        }),
        ApiBody({ type: ResetPasswordDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Код отправлен на почту (при успешной обработке запроса).',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Некорректный формат email'),
        ApiErrorResponse(
            422,
            'INVALID_EMAIL_FORMAT',
            'Указанный email адрес имеет некорректный формат',
        ),
        ApiNotFound('Пользователь с таким email не найден'),
    );

export const PostPasswordResetVerifySwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Проверка кода восстановления пароля',
            description: 'Проверяет код из письма и помечает сессию сброса как подтверждённую.',
        }),
        ApiBody({ type: VerifyResetCodeDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Код подтверждён, можно задать новый пароль.',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Ошибка валидации (email или формат кода)'),
        ApiBadRequest('Время подтверждения истекло или запрос не найден'),
        ApiBadRequest('Неверный или истёкший код подтверждения'),
    );

export const PostPasswordResetConfirmSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Установка нового пароля после сброса',
            description: 'Доступно только после успешной проверки кода на шаге verify.',
        }),
        ApiBody({ type: PasswordResetConfirmDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Пароль успешно изменён.',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Ошибка валидации (пароли не совпадают или неверная длина)'),
        ApiBadRequest('Сессия восстановления не найдена или истекла'),
        ApiForbidden(),
        ApiErrorResponse(
            500,
            'PASSWORD_UPDATE_FAILED',
            'Не удалось обновить пароль. Попробуйте позже.',
        ),
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

export const PostChangePasswordSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Смена пароля',
            description: 'Требует текущий и новый пароль. Инвалидирует все остальные сессии.',
        }),
        ApiBody({ type: ChangePasswordDto.Output }),
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
        ApiBody({ type: Confirm2FaDto.Output }),
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
        ApiBody({ type: Disable2FaDto.Output }),
        ApiResponse({ status: 200, description: '2FA успешно отключена.' }),
        ApiBadRequest('Неверный код или пароль для отключения'),
        ApiUnauthorized(),
    );
