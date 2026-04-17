import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import { ApiValidationError, ApiUnauthorized, ApiForbidden, ApiNotFound } from '@shared/error';
import { CreateProjectDto, UpdateProjectDto } from '../dtos';

export const CreateProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Создать новый проект в команде' }),
        ApiParam({ name: 'slug', type: 'string' }),
        ApiBody({ type: CreateProjectDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Проект успешно создан',
            type: ActionResponse.Output,
        }),
        ApiValidationError(),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const FindAllProjectsSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить список всех проектов команды' }),
        ApiParam({ name: 'slug', type: 'string' }),
        ApiResponse({
            status: 200,
            description: 'Список проектов получен',
            type: [Object],
        }),
        ApiUnauthorized(),
    );

export const FindOneProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить детальную информацию о проекте' }),
        ApiParam({
            name: 'id',
            description: 'CUID проекта',
            type: 'string',
            example: 'clv123456',
        }),
        ApiResponse({ status: 200, type: Object }),
        ApiNotFound('Проект не найден'),
        ApiUnauthorized(),
    );

export const UpdateProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Обновить информацию о проекте' }),
        ApiParam({
            name: 'id',
            description: 'CUID проекта',
            type: 'string',
            example: 'clv123456',
        }),
        ApiBody({ type: UpdateProjectDto.Output }),
        ApiResponse({ status: 200, description: 'Проект обновлен', type: ActionResponse.Output }),
        ApiValidationError(),
        ApiNotFound(),
        ApiUnauthorized(),
    );

export const RemoveProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Архивировать (удалить) проект' }),
        ApiParam({
            name: 'id',
            description: 'CUID проекта',
            type: 'string',
            example: 'clv123456',
        }),
        ApiResponse({ status: 200, description: 'Проект удален', type: ActionResponse.Output }),
        ApiNotFound(),
        ApiUnauthorized(),
    );

export const ArchiveProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Перевести проект в статус архива' }),
        ApiParam({
            name: 'id',
            description: 'CUID проекта',
            type: 'string',
            example: 'clv123456',
        }),
        ApiResponse({ status: 200, description: 'Статус обновлен', type: ActionResponse.Output }),
        ApiUnauthorized(),
    );

export const GetProjectByTokenSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить проект по публичному токену' }),
        ApiParam({ name: 'token', description: 'Токен доступа', type: 'string' }),
        ApiResponse({ status: 200, type: Object }),
        ApiNotFound('Токен недействителен'),
    );
