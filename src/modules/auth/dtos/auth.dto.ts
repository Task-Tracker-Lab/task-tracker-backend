import { createZodDto } from 'nestjs-zod';
import { z } from 'zod/v4';

export const SignInSchema = z
    .object({
        email: z.email('Некорректный формат email').describe('Email пользователя'),
        password: z.string().describe('Пароль пользователя'),
    })
    .describe('Схема входа в систему');

export class SignInDto extends createZodDto(SignInSchema) {}

export const SignUpSchema = z
    .object({
        email: z.email('Некорректный формат email').describe('Email пользователя'),
        password: z
            .string()
            .min(8, 'Пароль должен содержать минимум 8 символов')
            .max(32, 'Пароль должен содержать максимум 32 символа')
            .describe('Пароль (минимум 8 символов)'),
        firstName: z
            .string()
            .min(2, 'Имя должно содержать минимум 2 символа')
            .max(50)
            .trim()
            .describe('Имя'),
        lastName: z
            .string()
            .min(2, 'Фамилия должна содержать минимум 2 символа')
            .max(50)
            .trim()
            .describe('Фамилия'),
        middleName: z
            .string()
            .max(50)
            .trim()
            .optional()
            .or(z.literal(''))
            .describe('Отчество (опционально)'),
    })
    .describe('Схема регистрации пользователя');

export class SignUpDto extends createZodDto(SignUpSchema) {}

export const VerifySchema = z
    .object({
        email: z
            .string()
            .email('Некорректный формат email')
            .describe('Email пользователя, на который был отправлен код'),
        code: z
            .string()
            .length(6, 'Код должен содержать ровно 6 символов')
            .describe('6-значный OTP код подтверждения'),
    })
    .describe('Схема верификации OTP кода');

export class VerifyDto extends createZodDto(VerifySchema) {}
