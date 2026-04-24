import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';
import { roleEnum, TeamRole } from '../entities/enums';

export const UpdateInvitationSchema = z.object({
    role: z
        .enum(roleEnum.enumValues)
        .describe('Новая роль, которая будет назначена пользователю после принятия инвайта'),
});

export class UpdateInvitationDto extends createZodDto(UpdateInvitationSchema) {}

export const TeamInvitationSchema = z.object({
    code: z.string().describe('Код инвайта'),
    teamId: z.string().describe('ID команды'),
    teamName: z.string().describe('Название команды'),
    teamAvatar: z.string().nullable().describe('Аватар команды'),
    email: z.string().email().describe('Email приглашённого пользователя'),
    role: z.string().describe('Роль, которая будет назначена после принятия инвайта'),
    inviterId: z.string().describe('ID пользователя, отправившего приглашение'),
    inviterName: z.string().describe('Имя пригласившего'),
    createdAt: z.string().datetime().describe('Дата создания инвайта (ISO 8601)'),
    expiresAt: z.string().datetime().describe('Дата истечения инвайта (ISO 8601)'),
});

export class TeamInvitationResponse extends createZodDto(TeamInvitationSchema) {}

export interface TeamInvite {
    teamId: string;
    teamName: string;
    teamAvatar: string | null;
    email: string;
    role: TeamRole;
    inviterId: string;
    inviterName: string;
    createdAt: string;
    expiresAt: string;
}
