import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApiListQuery } from '@shared/decorators';
import {
    ApiUnauthorized,
    ApiNotFound,
    ApiValidationError,
    ApiForbidden,
    ApiConflict,
} from '@shared/error';
import { ZOD_RESPONSE_TOKEN } from '@shared/interceptors';
import { ActionResponse } from '@shared/schemas';

import {
    CreateStateDto,
    UpdateStateDto,
    CreateStateResponse,
    StateResponse,
    StatesResponse,
    MoveStateDto,
} from '../../dtos';

export const FindAllStatesSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить список всех колонок (статусов) на доске проекта',
            description: [
                'Возвращает все статусы, которые есть в проекте.',
                'В канбан-доске это колонки вроде «К выполнению», «В работе», «На ревью», «Готово».',
                'Метод позволяет фильтровать по категориям (бэклог, активные, завершённые),',
                'а также опционально подгружать количество задач в каждой колонке,',
                'сколько из них просрочено и сколько задач назначено на текущего пользователя.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiQuery({
            name: 'hidden',
            required: false,
            type: Boolean,
            description: 'Показать скрытые статусы (isVisible = false)',
            example: false,
        }),
        ApiQuery({
            name: 'category',
            required: false,
            enum: ['backlog', 'active', 'review', 'completed', 'archived'],
            description: 'Фильтр по категории статусов',
            example: 'active',
        }),
        ApiQuery({
            name: 'isLocked',
            required: false,
            type: Boolean,
            description: 'Фильтр по заблокированным статусам',
            example: false,
        }),
        ApiQuery({
            name: 'counts',
            required: false,
            type: Boolean,
            description: 'Добавить количество задач в каждом статусе (tasksCount)',
            example: true,
        }),
        ApiQuery({
            name: 'my',
            required: false,
            type: Boolean,
            description: 'Показать только мои задачи (добавляет myTasksCount)',
            example: false,
        }),
        ApiListQuery({
            sortableFields: ['order', 'title', 'tasksCount', 'createdAt'],
            defaultSortField: 'order',
            defaultSortOrder: 'asc',
        }),
        ApiQuery({
            name: 'overdue',
            required: false,
            type: Boolean,
            description:
                'Добавить информацию о просроченных задачах (hasOverdueTasks, overdueTasksCount)',
            example: true,
        }),
        ApiResponse({
            status: 200,
            description: 'Список состояний получен',
            type: StatesResponse.Output,
        }),
        ApiUnauthorized(),
        ApiNotFound('Проект не найден'),

        SetMetadata(ZOD_RESPONSE_TOKEN, StatesResponse),
    );

export const FindOneStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить детали одной колонки (статуса)',
            description: [
                'Возвращает полную информацию о конкретной колонке на доске:',
                'её название, цвет, иконку, тип (системная / кастомная),',
                'WIP-лимит (ограничение на число задач), а также порядок отображения.',
                'Полезно, например, при редактировании настроек колонки.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiParam({
            name: 'stateId',
            type: 'string',
            description: 'State id состояния',
            example: 'clv123456',
        }),
        ApiResponse({
            status: 200,
            description: 'Информация о состоянии получена',
            type: StateResponse.Output,
        }),
        ApiNotFound('Состояние не найдено'),
        ApiUnauthorized(),

        SetMetadata(ZOD_RESPONSE_TOKEN, StateResponse),
    );

export const CreateStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Создать новую колонку на доске',
            description: [
                'Добавляет новый статус (колонку) в проект.',
                'Например, вы хотите создать этап «Дизайн» или «Тестирование» между «В работе» и «Готово».',
                'Можно задать название, иконку, цвет, категорию, а также WIP-лимит —',
                'максимальное количество задач, которые могут одновременно находиться в этой колонке.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiBody({
            type: CreateStateDto.Output,
            description: 'Данные для создания состояния',
        }),
        ApiResponse({
            status: 201,
            description: 'Состояние успешно создано',
            type: CreateStateResponse.Output,
        }),
        ApiValidationError(),
        ApiUnauthorized(),
        ApiForbidden('Нет прав для создания состояния в этом проекте'),
        ApiConflict('Состояние с таким названием или типом уже существует'),

        SetMetadata(ZOD_RESPONSE_TOKEN, CreateStateResponse),
    );

export const UpdateStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить настройки колонки',
            description: [
                'Изменяет параметры существующей колонки: название, цвет, иконку, WIP-лимит.',
                'Системные (защищённые) статусы, например «Архив», нельзя переименовать или удалить,',
                'но можно поменять их внешний вид (цвет/иконку), чтобы они вписывались в дизайн вашей доски.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiParam({
            name: 'stateId',
            type: 'string',
            description: 'State id состояния',
            example: 'clv123456',
        }),
        ApiBody({
            type: UpdateStateDto.Output,
            description: 'Обновляемые поля',
        }),
        ApiResponse({
            status: 200,
            description: 'Состояние обновлено',
            type: ActionResponse.Output,
        }),
        ApiValidationError(),
        ApiNotFound('Состояние не найдено'),
        ApiUnauthorized(),
        ApiForbidden('Нельзя изменить системный статус'),
        ApiConflict('Состояние с таким названием уже существует'),

        SetMetadata(ZOD_RESPONSE_TOKEN, ActionResponse),
    );

export const MoveStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Переместить колонку на доске',
            description: [
                'Изменяет порядок колонки (статуса) на доске проекта.',
                'Позволяет переставлять колонки местами, задавая новую позицию.',
                'Кастомные колонки можно перемещать свободно, системные — нельзя.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiParam({
            name: 'stateId',
            type: 'string',
            description: 'State id состояния',
            example: 'clv123456',
        }),
        ApiBody({
            type: MoveStateDto.Output,
            description: 'Данные для перемещения состояния',
        }),
        ApiResponse({
            status: 200,
            description: 'Состояние перемещено',
            type: ActionResponse.Output,
        }),
        ApiValidationError(),
        ApiNotFound('Состояние не найдено'),
        ApiUnauthorized(),
        ApiForbidden('Нельзя переместить системный статус'),
        ApiConflict('Состояние заблокировано'),

        SetMetadata(ZOD_RESPONSE_TOKEN, ActionResponse),
    );

export const RemoveStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Удалить колонку (если в ней нет задач)',
            description: [
                'Мягкое удаление статуса (колонка перестаёт отображаться на доске).',
                'Важное ограничение: удалить колонку можно только тогда,',
                'когда в ней не находится ни одной задачи.',
                'Системные статусы удалять нельзя — это защита от случайной поломки логики проекта.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiParam({
            name: 'stateId',
            type: 'string',
            description: 'State id состояния',
            example: 'clv123456',
        }),
        ApiResponse({
            status: 200,
            description: 'Состояние удалено',
            type: ActionResponse.Output,
        }),
        ApiNotFound('Состояние не найдено'),
        ApiUnauthorized(),
        ApiForbidden('Нельзя удалить системный статус'),
        ApiConflict('Нельзя удалить статус, в котором есть задачи'),

        SetMetadata(ZOD_RESPONSE_TOKEN, ActionResponse),
    );

export const RestoreStateSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Вернуть удалённую колонку обратно на доску',
            description: [
                'Восстанавливает ранее мягко удалённый статус.',
                'Все настройки колонки (название, цвет, порядок) возвращаются как были.',
                'Полезно, если колонку удалили по ошибке или она снова понадобилась.',
            ].join('\n'),
        }),
        ApiParam({
            name: 'slug',
            type: 'string',
            description: 'Slug проекта',
            example: 'super-project',
        }),
        ApiParam({
            name: 'stateId',
            type: 'string',
            description: 'State id состояния',
            example: 'clv123456',
        }),
        ApiResponse({
            status: 200,
            description: 'Состояние восстановлено',
            type: ActionResponse.Output,
        }),
        ApiNotFound('Удалённое состояние не найдено'),
        ApiUnauthorized(),
        ApiForbidden('Нет прав для восстановления'),

        SetMetadata(ZOD_RESPONSE_TOKEN, ActionResponse),
    );
