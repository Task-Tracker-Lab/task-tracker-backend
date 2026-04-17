import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';
import { ProjectStatus, ProjectVisibility } from '../entities';

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
    icon: z.string().url().optional().nullable(),
    color: z
        .string()
        .regex(/^#[A-Fa-f0-9]{6}$/, 'Цвет должен быть в формате HEX (например, #FFFFFF)')
        .optional(),
    visibility: z.enum(['public', 'private']).default('public'),
});

export class CreateProjectDto extends createZodDto(CreateProjectSchema) {}

export const UpdateProjectSchema = z.object({
    name: z
        .string()
        .min(1, 'Название не может быть пустым')
        .max(100, 'Название до 100 символов')
        .optional(),
    description: z.string().max(2000, 'Описание до 2000 символов').nullable().optional(),
    icon: z.string().url('Некорректная ссылка на иконку').optional().nullable(),
    color: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6})$/, 'Цвет должен быть HEX (например, #FFFFFF)')
        .optional(),
    status: z.enum([ProjectStatus.Active, ProjectStatus.Archived]).optional(),
    visibility: z.enum([ProjectVisibility.Public, ProjectVisibility.Private]).optional(),
    isPubliclyViewable: z.boolean().optional(),
    // TODO: AT FEATURE RESOLVE WITH SETTINGS
    settings: z.record(z.string(), z.string()).optional(),
});

export class UpdateProjectDto extends createZodDto(UpdateProjectSchema) {}
