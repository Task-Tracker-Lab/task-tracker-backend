import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import {
    ApiBadRequest,
    ApiConflict,
    ApiForbidden,
    ApiNotFound,
    ApiUnauthorized,
    ApiValidationError,
} from '@shared/error';
import {
    InviteMemberDto,
    TeamInvitationResponse,
    UpdateInvitationDto,
    UserInviteResponse,
} from '../../dtos';

export const FindInvitesSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить список входящих приглашений',
            description:
                'Возвращает все активные приглашения в команды, отправленные на email текущего пользователя.',
        }),
        ApiResponse({
            status: 200,
            description: 'Список приглашений успешно получен',
            type: [UserInviteResponse.Output],
        }),
        ApiUnauthorized(),
    );

export const InviteMemberSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Пригласить пользователя в команду по Email',
            description:
                'Создает запись об участнике со статусом "pending".' +
                ' Если пользователь уже зарегистрирован — он увидит приглашение в разделе "my/invites".' +
                ' Если нет — ему уйдет письмо на указанный Email.',
        }),
        ApiBody({ type: InviteMemberDto.Output }),
        ApiParam({ name: 'slug', description: 'Слаг команды, в которую приглашаем' }),
        ApiResponse({
            status: 201,
            description: 'Инвайт создан и отправлен',
            type: ActionResponse.Output,
        }),
        ApiValidationError('Некорректный формат Email или роль не поддерживается'),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const AcceptInviteSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Принять приглашение в команду',
            description:
                'Активирует участие пользователя в команде по уникальному коду приглашения.' +
                ' После успешного принятия статус участника меняется с "pending" на "active".' +
                ' Система автоматически связывает текущего авторизованного пользователя с инвайтом через Email.',
        }),
        ApiParam({
            name: 'code',
            description: 'Уникальный код/токен приглашения (из ссылки или письма)',
            example: '7df1-4a2b-9e8c',
        }),
        ApiResponse({
            status: 200,
            description: 'Приглашение успешно принято. Пользователь теперь участник команды.',
            type: ActionResponse.Output,
        }),
        ApiBadRequest('Невалидный код, срок действия приглашения истек или оно уже использовано'),
        ApiNotFound('Приглашение с таким кодом не найдено'),
        ApiConflict('Пользователь уже является участником этой команды'),
        ApiUnauthorized(),
    );

export const GetTeamInvitationsSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить список всех приглашений в команду',
            description: 'Возвращает все активные инвайты команды. Доступно только owner/admin.',
        }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiResponse({
            status: 200,
            description: 'Список приглашений команды',
            type: [TeamInvitationResponse.Output],
        }),
        ApiNotFound('Команда не найдена'),
        ApiForbidden('Недостаточно прав (только owner/admin)'),
        ApiUnauthorized(),
    );

export const GetTeamInvitationSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить приглашение по коду',
            description:
                'Возвращает данные инвайта по коду в рамках команды. Доступно только owner/admin.',
        }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'code', description: 'Код инвайта' }),
        ApiResponse({
            status: 200,
            description: 'Инвайт найден',
            type: TeamInvitationResponse.Output,
        }),
        ApiNotFound('Инвайт или команда не найдены'),
        ApiForbidden('Недостаточно прав (только owner/admin)'),
        ApiUnauthorized(),
    );

export const UpdateTeamInvitationSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Обновить приглашение (только роль)',
            description:
                'Позволяет изменить только поле role у существующего инвайта. TTL сохраняется.',
        }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'code', description: 'Код инвайта' }),
        ApiBody({ type: UpdateInvitationDto.Output }),
        ApiResponse({
            status: 200,
            description: 'Инвайт обновлён',
            type: TeamInvitationResponse.Output,
        }),
        ApiValidationError(),
        ApiNotFound('Инвайт или команда не найдены'),
        ApiForbidden('Недостаточно прав (только owner/admin)'),
        ApiUnauthorized(),
    );

export const DeleteTeamInvitationSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Удалить приглашение',
            description:
                'Удаляет инвайт и чистит индексы в Redis (team:invites и user:invites). Доступно только owner/admin.',
        }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'code', description: 'Код инвайта' }),
        ApiResponse({
            status: 200,
            description: 'Инвайт удалён',
            type: ActionResponse.Output,
        }),
        ApiNotFound('Инвайт или команда не найдены'),
        ApiForbidden('Недостаточно прав (только owner/admin)'),
        ApiUnauthorized(),
    );
