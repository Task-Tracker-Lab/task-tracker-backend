import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';

export const ActionResponseSchema = z.object({
    success: z.boolean().describe('Статус операции'),
    message: z.string().optional().describe('Сообщение для пользователя'),
});

export class ActionResponse extends createZodDto(ActionResponseSchema) {}
