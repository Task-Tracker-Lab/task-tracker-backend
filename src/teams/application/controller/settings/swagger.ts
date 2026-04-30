import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ActionResponse } from '@shared/dtos';
import { ApiBadRequest, ApiForbidden, ApiNotFound, ApiUnauthorized } from '@shared/error';
import { SyncTagsDto } from '../../dtos';
import { FileUploadResponse } from '@shared/media';

export const SyncTeamTagsSwagger = () =>
    applyDecorators(
        ApiOperation({ summary: 'Синхронизировать теги команды' }),
        ApiBody({ type: SyncTagsDto.Output }),
        ApiResponse({ status: 200, description: 'Теги обновлены', type: ActionResponse.Output }),
        ApiForbidden(),
        ApiNotFound(),
        ApiUnauthorized(),
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
