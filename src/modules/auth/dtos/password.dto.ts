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
