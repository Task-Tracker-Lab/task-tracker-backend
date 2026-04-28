import z from 'zod/v4';
import { createZodDto } from 'nestjs-zod';

export const Confirm2FaSchema = z
    .object({
        code: z
            .string()
            .length(6, 'Код должен состоять ровно из 6 символов')
            .describe('6-значный код из Google Authenticator'),
    })
    .describe('Схема подтверждения 2FA');

export class Confirm2FaDto extends createZodDto(Confirm2FaSchema) {}

export const Disable2FaSchema = z
    .object({
        password: z.string().optional().describe('Текущий пароль для подтверждения (опционально)'),
        code: z.string().optional().describe('Код из приложения (опционально)'),
    })
    .refine((data) => data.password || data.code, {
        message: 'Нужно передать либо пароль, либо код',
    })
    .describe('Схема отключения 2FA');

export class Disable2FaDto extends createZodDto(Disable2FaSchema) {}
