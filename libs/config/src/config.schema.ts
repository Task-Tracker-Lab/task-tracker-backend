import { z } from 'zod/v4';

export const ConfigSchema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DB_USERNAME: z.string({ error: 'DB_USERNAME is missing' }),
    DB_PASSWORD: z.string({ error: 'DB_PASSWORD is missing' }),
    DB_DATABASE: z.string({ error: 'DB_DATABASE is missing' }),
    DB_SCHEMA: z.string({ error: 'DB_SCHEMA is missing' }),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
    REDIS_HOST: z.string().default('redis'),
    REDIS_PORT: z.coerce.number().default(6379),
    DOMAIN: z
        .string()
        .toLowerCase()
        .refine((val) => !val || /^[a-z0-9.-]+\.[a-z]{2,}$/.test(val), {
            message: 'DOMAIN must be a valid hostname (e.g., example.com)',
        })
        .optional(),
    STAGE_DOMAIN: z
        .string()
        .toLowerCase()
        .refine((val) => !val || /^[a-z0-9.-]+\.[a-z]{2,}$/.test(val), {
            message: 'STAGE_DOMAIN must be a valid hostname',
        })
        .optional(),
    CORS_ALLOWED_ORIGINS: z
        .string()
        .min(1, "CORS_ALLOWED_ORIGINS can't be empty")
        .transform((val) => val.split(',').map((s) => s.trim()))
        .pipe(z.array(z.string().url('Each origin must be a valid URL'))),
});

export type Config = z.infer<typeof ConfigSchema>;
