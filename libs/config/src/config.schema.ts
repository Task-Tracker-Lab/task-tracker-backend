import { z } from 'zod/v4';
import { jwtSecretValidation } from './helpers/jwt-secren-validation';

const timeStringSchema = z.string().regex(/^[0-9]+[smhdw]$/, {
    message: 'Invalid time format. Use: s, m, h, d, w (e.g., 15m, 24h, 30d)',
});

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
    JWT_ACCESS_SECRET: z.string().refine(jwtSecretValidation, {
        message:
            'JWT_ACCESS_SECRET must be at least 32 characters long OR contain at least 5 words separated by hyphens',
    }),
    JWT_REFRESH_SECRET: z.string().refine(jwtSecretValidation, {
        message:
            'JWT_REFRESH_SECRET must be at least 32 characters long OR contain at least 5 words separated by hyphens',
    }),
    JWT_ACCESS_EXPIRES_IN: timeStringSchema.default('15m'),
    JWT_REFRESH_EXPIRES_IN: timeStringSchema.default('30d'),
    MAIL_HOST: z
        .string({
            error: 'Mail server host (MAIL_HOST) is not specified',
        })
        .min(1, 'MAIL_HOST cannot be empty'),
    MAIL_PORT: z.coerce.number({
        error: 'Mail port (MAIL_PORT) is not specified',
    }),
    MAIL_USER: z
        .string({
            error: 'Sender email (MAIL_USER) is not specified',
        })
        .email('MAIL_USER must be a valid email address'),
    MAIL_PASSWORD: z
        .string({
            error: 'Mail password (MAIL_PASSWORD) is required',
        })
        .min(1, 'Mail password cannot be empty'),
    MAIL_FROM_NAME: z
        .string({
            error: 'Sender name (MAIL_FROM_NAME) is not specified',
        })
        .min(1, 'Sender name cannot be empty'),
    MAIL_FROM_EMAIL: z.string().email('Invalid MAIL_FROM_EMAIL format').optional(),
    S3_BUCKET_NAME: z
        .string({
            error: "S3_BUCKET_NAME is required. Example: 'avatars'",
        })
        .min(1),
    S3_ENDPOINT: z
        .string({
            error: "S3_ENDPOINT is required. Example: 'http://localhost:9000'",
        })
        .url('S3_ENDPOINT must be a valid URL'),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY: z.string({
        error: 'S3_ACCESS_KEY is missing (MinIO root user or IAM user)',
    }),
    S3_SECRET_KEY: z.string({
        error: 'S3_SECRET_KEY is missing (MinIO root password or IAM secret)',
    }),
});

export type Config = z.infer<typeof ConfigSchema>;
