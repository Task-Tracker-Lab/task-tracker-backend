import { HttpStatus, Injectable } from '@nestjs/common';
import { S3Service } from '@libs/s3';
import type { FileUploadDto, FileUploadResponseDto } from './dtos';
import { IUserMedia } from './interfaces/user-media.interface';
import { ITeamMedia } from './interfaces/team-media.interface';
import { BaseException } from '@shared/error';

@Injectable()
export class MediaService implements IUserMedia, ITeamMedia {
    constructor(private readonly s3: S3Service) {}

    private async uploadAndLink(
        file: FileUploadDto,
        folder: string,
        updateDbFn: (url: string) => Promise<boolean>,
    ): Promise<FileUploadResponseDto> {
        const url = await this.s3.uploadFile(file.buffer, file.filename, file.mimetype, folder);

        try {
            const isUpdated = await updateDbFn(url);

            if (!isUpdated) {
                throw new BaseException(
                    {
                        code: 'ENTITY_NOT_FOUND',
                        message: 'Сущность не найдена, обновление отменено',
                        details: [
                            {
                                target: 'id',
                                message: 'Record with provided ID does not exist in database',
                            },
                        ],
                    },
                    HttpStatus.NOT_FOUND,
                );
            }

            return { success: true, url };
        } catch (error) {
            await this.s3.deleteFile(url);

            if (error instanceof BaseException) {
                throw error;
            }

            throw new BaseException(
                {
                    code: 'MEDIA_SAVE_FAILED',
                    message: 'Ошибка при сохранении медиа-данных',
                    details: [
                        {
                            reason:
                                error instanceof Error ? error.message : 'Unknown database error',
                        },
                    ],
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    public async uploadUserAvatar(
        userId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ) {
        return this.uploadAndLink(file, `users/${userId}/avatars`, updateFn);
    }

    public async uploadTeamAvatar(
        teamId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ) {
        return this.uploadAndLink(file, `teams/${teamId}/avatars`, updateFn);
    }

    public async uploadTeamBanner(
        teamId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ) {
        return this.uploadAndLink(file, `teams/${teamId}/banners`, updateFn);
    }
}
