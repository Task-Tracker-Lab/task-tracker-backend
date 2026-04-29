import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import { ApiForbidden, ApiNotFound, ApiUnauthorized } from '@shared/error';
import {
    TeamMemberResponse,
    UpdateMemberDto,
    UserTeamResponse,
    UserInviteResponse,
} from '../../dtos';

export const FindTeamsSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Получить список команд пользователя',
            description:
                'Возвращает все команды, в которых текущий пользователь является участником или владельцем.',
        }),
        ApiResponse({
            status: 200,
            description: 'Список команд получен',
            type: [UserTeamResponse.Output],
        }),
        ApiUnauthorized(),
    );

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

export const GetMembersSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Получить список всех участников команды' }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiResponse({
            status: 200,
            description: 'Список участников получен',
            type: [TeamMemberResponse.Output],
        }),
        ApiUnauthorized(),
        ApiForbidden(),
    );

export const UpdateMemberSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Изменить роль или статус участника',
            description:
                'Позволяет изменить роль участника (member -> admin) или вручную изменить его статус.' +
                ' Владелец команды (Owner) не может понизить свою роль через этот эндпоинт.',
        }),
        ApiBody({ type: UpdateMemberDto.Output }),
        ApiParam({ name: 'slug', description: 'Слаг команды' }),
        ApiParam({ name: 'userId', description: 'ID пользователя, чьи права редактируются' }),
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
            status: 200,
            type: ActionResponse.Output,
            description: 'Участник успешно удален',
        }),
        ApiNotFound(),
        ApiUnauthorized(),
        ApiForbidden(),
    );
