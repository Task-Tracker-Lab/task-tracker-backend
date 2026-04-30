import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import { ApiValidationError, ApiUnauthorized, ApiForbidden, ApiNotFound } from '@shared/error';
import {
    CreateProjectDto,
    CreateProjectResponse,
    CreateShareTokenDto,
    UpdateProjectDto,
} from '../../dtos';

export const CreateProjectSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Создать новый проект в команде' }),
        ApiParam({ name: 'slug', type: 'string' }),
        ApiBody({ type: CreateProjectDto.Output }),
        ApiResponse({
            status: 201,
            description: 'Проект успешно создан',
            type: CreateProjectResponse.Output,
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

export const CreateShareTokenSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Сгенерировать публичную ссылку',
            description:
                'Создает защищенный токен доступа к проекту. Если expiresAt не указан, по умолчанию ставится доступ на 3 месяца.',
        }),
        ApiParam({
            name: 'slug',
            description: 'Slug команды',
            type: 'string',
        }),
        ApiParam({
            name: 'id',
            description: 'CUID проекта',
            type: 'string',
            example: 'clv123456',
        }),
        ApiBody({
            type: CreateShareTokenDto.Output,
            description: 'Настройки срока действия ссылки',
        }),
        ApiResponse({
            status: 201,
            description: 'Токен успешно создан',
            type: ActionResponse.Output,
        }),
        ApiNotFound('Проект не найден в этой команде'),
        ApiValidationError('Некорректная дата или параметры'),
        ApiUnauthorized(),
        ApiForbidden('У вас нет прав для создания ссылки для этого проекта'),
    );
