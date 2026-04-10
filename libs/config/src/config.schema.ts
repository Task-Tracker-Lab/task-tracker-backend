import { z } from 'zod/v4';

export const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;
