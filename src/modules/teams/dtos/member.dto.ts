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

const UpdateMemberDtoSchema = z.object({
    role: z.string().optional().describe('Новая роль участника'),
    status: z.string().optional().describe('Новый статус (active, blocked и т.д.)'),
});

export class UpdateMemberDto extends createZodDto(UpdateMemberDtoSchema) {}

export const TeamMemberResponseSchema = z.object({
    id: z.string().describe('Уникальный ID пользователя (UUID или ULID)'),
    role: z
        .enum(['owner', 'admin', 'member'])
        .describe('Роль участника в рамках конкретной команды'),
    status: z
        .enum(['active', 'pending', 'blocked'])
        .describe('Текущий статус членства (активен, ожидает приглашения, заблокирован)'),
    fullName: z.string().describe('Полное имя для отображения (Фамилия Имя Отчество)'),
    firstName: z.string().describe('Имя пользователя'),
    lastName: z.string().describe('Фамилия пользователя'),
    avatarUrl: z
        .string()
        .url()
        .nullable()
        .describe('Прямая ссылка на изображение профиля или null, если не задано'),

    initials: z.string().max(2).describe('Две буквы для аватара-заглушки (например, "ИИ")'),
    joinedAt: z
        .string()
        .datetime()
        .describe('Дата и время вступления в команду в формате ISO 8601'),
});

export class TeamMemberResponse extends createZodDto(TeamMemberResponseSchema) {}

export const UserInviteSchema = z.object({
    code: z.string().describe('Код инвайта'),
    teamName: z.string().describe('Название команды'),
    teamAvatar: z.string().nullable().describe('Аватар команды'),
    role: z.string().describe('Роль'),
    inviterName: z.string().describe('Имя пригласившего'),
    expiresAt: z.string().datetime().describe('Дата истечения'),
});

export class UserInviteResponse extends createZodDto(UserInviteSchema) {}
