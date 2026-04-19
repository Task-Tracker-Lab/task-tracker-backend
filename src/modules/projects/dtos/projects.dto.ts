import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';
import { ProjectStatus } from '../entities';
import { ActionResponseSchema } from '@shared/dtos';

export const CreateProjectSchema = z.object({
    name: z
        .string()
        .min(1, 'Название проекта не может быть пустым')
        .max(100, 'Название не должно превышать 100 символов'),
    key: z
        .string()
        .min(2, 'Ключ проекта должен быть от 2 до 10 символов')
        .max(10)
        .regex(/^[A-Z0-9]+$/, 'Ключ должен содержать только заглавные латинские буквы и цифры'),
    description: z.string().max(2000, 'Описание слишком длинное').optional().nullable(),
    icon: z.string().optional().nullable(),
    color: z
        .string()
        .regex(/^#[A-Fa-f0-9]{6}$/, 'Цвет должен быть в формате HEX (например, #FFFFFF)')
        .optional(),
    visibility: z.enum(['public', 'private']).default('public'),
});

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}

export const UpdateProjectSchema = CreateProjectSchema.extend({
    status: z.enum([ProjectStatus.Active, ProjectStatus.Archived]).optional(),
    isPublic: z.boolean().optional(),
})
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
        error: 'Необходимо передать хотя бы одно поле для обновления',
        abort: true,
    });

export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) {}

const CreateProjectsResponseSchema = ActionResponseSchema.extend({
    projectId: z.string().describe('Уникальный идентификатор проекта в системе'),
});

export class CreateProjectResponse extends createZodDto(CreateProjectsResponseSchema) {}

export const CreateShareTokenSchema = z.object({
    ttl: z
        .string()
        .datetime()
        .optional()
        .nullable()
        .describe('Дата истечения ссылки. Если не указана — ставится дефолт 3 месяца'),
});

export class CreateShareTokenDto extends createZodDto(CreateShareTokenSchema) {}
