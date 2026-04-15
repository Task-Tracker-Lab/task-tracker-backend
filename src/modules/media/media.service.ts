import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Service } from '@libs/s3';
import { FileUploadDto, FileUploadResponseDto } from './dtos';
import { IUserMedia } from './interfaces/user-media.interface';
import { ITeamMedia } from './interfaces/team-media.interface';

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
                throw new Error('ENTITY_NOT_FOUND');
            }

            return { success: true, url };
        } catch (error) {
            await this.s3.deleteFile(url);

            if (error.message === 'ENTITY_NOT_FOUND') {
                throw new BadRequestException('Сущность не найдена, обновление отменено');
            }

            throw new BadRequestException('Ошибка при сохранении медиа-данных');
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
