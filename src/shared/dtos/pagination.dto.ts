import { z } from 'zod/v4';
import { createZodDto } from 'nestjs-zod';

export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class PaginationDto extends createZodDto(PaginationSchema) {}
