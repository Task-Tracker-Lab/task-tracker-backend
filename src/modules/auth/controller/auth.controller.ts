// POST /auth/register — Регистрация (создание записей в users, user_security, user_notifications).
// POST /auth/login — Вход (выдача Access/Refresh токенов). Если включен 2FA — возврат промежуточного токена.
// POST /auth/refresh — Обновление пары токенов через Refresh Token.
// POST /auth/logout — Удаление текущей сессии из Redis.
// GET /auth/sessions — Список всех активных устройств пользователя.
// DELETE /auth/sessions/:cuid — Принудительное завершение сессии на другом устройстве.
// POST /auth/change-password — Смена пароля (требует oldPassword и newPassword).
// Logic: При успехе обновляем lastPasswordChange и инвалидируем все сессии в Redis, кроме текущей.
// POST /auth/2fa/enable — Генерация QR-кода (возвращает otpauth ссылку).
// POST /auth/2fa/confirm — Подтверждение включения 2FA (проверка первого кода).
// PATCH /auth/2fa/disable — Отключение (обязательно под паролем или кодом).

import { ApiBaseController } from '../../../shared/decorators';
import { Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { AuthService } from '../auth.service';

@ApiBaseController('auth', 'Auth')
export class AuthController {
    constructor(private readonly facade: AuthService) {}

    @Post('register')
    // @PostRegisterSwagger()
    async register() {}

    @Post('login')
    // @PostLoginSwagger()
    @HttpCode(200)
    async login() {}

    @Post('refresh')
    // @PostRefreshSwagger()
    @HttpCode(200)
    async refresh() {}

    @Post('logout')
    // @PostLogoutSwagger()
    @HttpCode(200)
    async logout() {}

    @Get('sessions')
    // @GetSessionsSwagger()
    async getSessions() {}

    @Delete('sessions/:cuid')
    // @DeleteTerminateSessionSwagger
    async terminateSession() {}

    @Post('change-password')
    // @PostChangePasswordSwagger
    @HttpCode(200)
    async changePassword() {}

    @Post('2fa/enable')
    @HttpCode(200)
    // @PostEnable2faSwagger
    async enable2fa() {}

    @Patch('2fa/disable')
    // @PostDisable2faSwagger
    async disable2fa() {}

    @Post('2fa/confirm')
    @HttpCode(200)
    // @PostConfirm2faSwagger
    async confirm2fa() {}
}
