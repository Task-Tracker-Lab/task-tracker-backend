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
