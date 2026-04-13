import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';

export const InviteMemberSchema = z.object({
    email: z.string().email().describe('Email пользователя, которого нужно пригласить'),
    role: z
        .string()
        .default('member')
        .describe('Роль, которая будет назначена пользователю после принятия инвайта'),
});

export class InviteMemberDto extends createZodDto(InviteMemberSchema) {}

export class UpdateMemberDto extends createZodDto(
    z.object({
        role: z.string().optional().describe('Новая роль участника'),
        status: z.string().optional().describe('Новый статус (active, blocked и т.д.)'),
    }),
) {}
