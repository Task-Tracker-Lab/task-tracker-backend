import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ActionResponse } from 'src/shared/dtos';
import {
    ApiBadRequest,
    ApiConflict,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from 'src/shared/error';
import { CreateTeamDto, InviteMemberDto, SyncTagsDto, UpdateTeamDto, TagResponse } from '../dtos';
import { FileUploadResponse } from '../../media/dtos';

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

export const FindAllTeamsSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить список команд пользователя' }),
        ApiResponse({
            status: 200,
            description: 'Список команд получен',
            type: [Object],
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
            status: 204,
            description: 'Команда успешно удалена',
            type: ActionResponse.Output,
        }),
        ApiForbidden(),
        ApiNotFound(),
        ApiUnauthorized(),
    );

export const SyncTeamTagsSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Синхронизировать теги команды' }),
        ApiBody({ type: SyncTagsDto.Output }),
        ApiResponse({ status: 200, description: 'Теги обновлены', type: ActionResponse.Output }),
        ApiForbidden(),
        ApiNotFound(),
        ApiUnauthorized(),
    );

export const GetAllTagsSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить список всех тегов с пагинацией',
            description:
                'Возвращает список всех тегов в системе с пагинацией. Используется для поиска и автокомплита при создании/редактировании команд.',
        }),
        ApiResponse({
            status: 200,
            description: 'Список тегов успешно получен',
            type: TagResponse.Output,
        }),
        ApiUnauthorized(),
    );

export const GetMembersSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить список всех участников команды' }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiResponse({
            status: 200,
            description: 'Список участников получен',
            type: [Object],
        }),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const InviteMemberSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Пригласить пользователя в команду по Email' }),
        ApiBody({ type: InviteMemberDto.Output }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiResponse({ status: 201, description: 'Инвайт создан и отправлен' }),
        ApiValidationError('Ошибка в формате email или данных'),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const UpdateMemberSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Изменить роль или статус участника' }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'userId', description: 'ID пользователя' }),
        ApiResponse({
            status: 200,
            description: 'Данные участника обновлены',
            type: ActionResponse.Output,
        }),
        ApiNotFound('Участник или команда не найдены'),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const RemoveMemberSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Удалить участника из команды' }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'userId', description: 'ID пользователя' }),
        ApiResponse({
            status: 204,
            type: ActionResponse.Output,
            description: 'Участник успешно удален',
        }),
        ApiNotFound(),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const PatchTeamAvatarSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить аватар команды',
            description: 'Загрузка файла изображения для профиля команды.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Аватар команды успешно обновлен.',
            type: FileUploadResponse.Output,
        }),
        ApiBadRequest('Файл не передан или имеет неверный формат'),
        ApiNotFound('Команда не найдена'),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const PatchTeamBannerSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить баннер команды',
            description: 'Загрузка файла изображения для обложки (баннера) команды.',
        }),
        ApiConsumes('multipart/form-data'),
        ApiBody({
            schema: {
                type: 'object',
                properties: {
                    file: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Баннер команды успешно обновлен.',
            type: FileUploadResponse.Output,
        }),
        ApiBadRequest('Файл не передан или имеет неверный формат'),
        ApiNotFound('Команда не найдена'),
        ApiUnauthorized(),
        ApiForbidden(),
    );
