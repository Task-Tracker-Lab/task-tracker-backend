import { FileUploadDto, FileUploadResponse } from '../dtos';

export const USER_MEDIA_TOKEN = 'IUserMedia';

export interface IUserMedia {
    uploadUserAvatar(
        userId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ): Promise<FileUploadResponse>;
}
