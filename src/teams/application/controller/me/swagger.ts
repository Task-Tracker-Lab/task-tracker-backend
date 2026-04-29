import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiUnauthorized } from '@shared/error';
import { UserTeamResponse, UserInviteResponse } from '../../dtos';

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
