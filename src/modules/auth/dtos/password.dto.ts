import { createZodDto } from 'nestjs-zod';
import z from 'zod/v4';

export const ChangePasswordSchema = z
    .object({
        oldPassword: z.string().describe('Текущий пароль'),
        newPassword: z
            .string()
            .min(8, 'Новый пароль должен содержать минимум 8 символов')
            .max(32, 'Новый пароль должен содержать максимум 32 символа')
            .describe('Новый пароль (минимум 8 символов)'),
    })
    .describe('Схема смены пароля');

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

export const ResetPasswordSchema = z.object({
    email: z.string().email('Некорректный формат email').describe('Email для восстановления'),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}

export const VerifyResetCodeSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6, 'Код должен содержать 6 цифр').describe('Код из письма'),
});

export class VerifyResetCodeDto extends createZodDto(VerifyResetCodeSchema) {}

export const PasswordResetConfirmSchema = z
    .object({
        email: z.string().email(),
        password: z
            .string()
            .min(8, 'Минимум 8 символов')
            .max(32, 'Максимум 32 символа')
            .describe('Новый пароль'),
        confirmPassword: z.string().describe('Повторите новый пароль'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export class PasswordResetConfirmDto extends createZodDto(PasswordResetConfirmSchema) {}
