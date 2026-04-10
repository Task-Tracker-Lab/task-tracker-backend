import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthResponse } from '../dtos';

export const GetHealthSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Краткий статус (Health Check)',
            description: 'Используется внешними системами для проверки доступности сервиса.',
        }),
        ApiResponse({ status: 200, description: 'Сервис работает нормально', type: String }),
        ApiResponse({ status: 503, description: 'Сервис недоступен или критическая ошибка' }),
    );

export const GetPingSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Детальный дамп состояния',
            description: 'Возвращает аптайм, время старта и метрики памяти.',
        }),
        ApiResponse({
            status: 200,
            description: 'Полная статистика сервиса',
            type: HealthResponse.Output,
        }),
    );
