import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const LoginSchema = z
    .object({
        email: z.email('Некорректный формат email').describe('Email пользователя'),
        password: z.string().describe('Пароль пользователя'),
    })
    .describe('Схема входа в систему');

export class LoginDto extends createZodDto(LoginSchema) {}

export const RegisterSchema = z
    .object({
        email: z.email('Некорректный формат email').describe('Email пользователя'),
        password: z
            .string()
            .min(8, 'Пароль должен содержать минимум 8 символов')
            .max(32, 'Пароль должен содержать максимум 32 символа')
            .describe('Пароль (минимум 8 символов)'),
        fullName: z
            .string()
            .min(2, 'Имя должно содержать минимум 2 символа')
            .max(255)
            .describe('Полное имя пользователя'),
    })
    .describe('Схема регистрации пользователя');

export class RegisterDto extends createZodDto(RegisterSchema) {}

export const RefreshSchema = z
    .object({
        refreshToken: z.string().describe('Refresh токен для обновления сессии'),
    })
    .describe('Схема обновления токенов');

export class RefreshDto extends createZodDto(RefreshSchema) {}
