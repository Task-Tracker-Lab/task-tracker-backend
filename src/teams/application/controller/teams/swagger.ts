import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import {
    ApiConflict,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from '@shared/error';
import { CreateTeamDto, UpdateTeamDto, CheckSlugResponse } from '../../dtos';

export const CreateTeamSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Создать новую команду' }),
        ApiBody({ type: CreateTeamDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Команда успешно создана',
            type: ActionResponse.Output,
        }),
        ApiConflict('Команда с таким slug уже существует'),
        ApiValidationError(),
        ApiUnauthorized(),
    );

export const CheckSlugSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Проверить доступность слага',
            description: 'Проверяет, свободен ли уникальный адрес команды для использования.',
        }),
        ApiParam({
            name: 'slug',
            description: 'Желаемый слаг команды',
            example: 'my-super-team',
        }),
        ApiResponse({
            status: 200,
            description: 'Результат проверки доступности',
            type: CheckSlugResponse.Output,
        }),
        ApiUnauthorized(),
    );

export const FindOneTeamSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить детальную информацию о команде по slug' }),
        ApiParam({ name: 'slug', description: 'Уникальный идентификатор (слаг) команды' }),
        ApiResponse({
            status: 200,
            description: 'Данные команды получены',
            type: Object,
        }),
        ApiNotFound('Команда не найдена'),
        ApiUnauthorized(),
    );

export const UpdateTeamSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Обновить данные команды' }),
        ApiBody({ type: UpdateTeamDto.Output }),
        ApiParam({ name: 'slug', description: 'Слаг команды для редактирования' }),
        ApiResponse({
            status: 200,
            description: 'Команда успешно обновлена',
            type: ActionResponse.Output,
        }),
        ApiForbidden(),
        ApiNotFound(),
        ApiValidationError(),
        ApiUnauthorized(),
    );

export const RemoveTeamSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Удалить команду' }),
        ApiParam({ name: 'slug', description: 'Слаг команды для удаления' }),
        ApiResponse({
            status: 200,
            description: 'Команда успешно удалена',
            type: ActionResponse.Output,
        }),
        ApiForbidden(),
        ApiNotFound(),
        ApiUnauthorized(),
    );
