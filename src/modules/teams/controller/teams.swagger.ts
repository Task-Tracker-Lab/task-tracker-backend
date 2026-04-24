import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiConsumes } from '@nestjs/swagger';
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
    CreateTeamDto,
    InviteMemberDto,
    TeamInvitationResponse,
    SyncTagsDto,
    UpdateTeamDto,
    TagResponse,
    TeamMemberResponse,
    CheckSlugResponse,
    UpdateMemberDto,
    UpdateInvitationDto,
    UserTeamResponse,
    UserInviteResponse,
} from '../dtos';
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
            type: [TeamMemberResponse.Output],
        }),
        ApiUnauthorized(),
        ApiForbidden(),
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
