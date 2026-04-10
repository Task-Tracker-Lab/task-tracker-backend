import { createZodDto } from 'node_modules/nestjs-zod/dist/dto.cjs';
import { z } from 'zod/v4';

const HealthResponseSchema = z.object({
    service: z.string().describe('Название сервиса'),
    status: z.enum(['up', 'down']).describe('Текущий статус'),
    info: z.object({
        version: z.string().describe('Версия приложения'),
        node: z.string().describe('Версия Node.js'),
        pid: z.number().describe('ID процесса'),
    }),
    time: z.object({
        now: z.string().datetime().describe('Текущее время сервера'),
        startedAt: z.string().datetime().describe('Время старта сервера'),
        uptime: z.string().describe('Аптайм в формате ч/м/с'),
        uptimeSeconds: z.number().describe('Аптайм в секундах'),
    }),
    metrics: z.object({
        rss: z.string().describe('Resident Set Size (общая память)'),
        heapUsed: z.string().describe('Использованная память в куче'),
        loadAverage: z.string().describe('Средняя нагрузка на CPU'),
    }),
});

export class HealthResponse extends createZodDto(HealthResponseSchema) {}
