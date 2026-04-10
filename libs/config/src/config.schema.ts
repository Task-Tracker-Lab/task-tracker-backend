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
});

export type Config = z.infer<typeof ConfigSchema>;
