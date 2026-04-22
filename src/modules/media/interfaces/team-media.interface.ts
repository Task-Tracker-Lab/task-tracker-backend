import type { FileUploadDto, FileUploadResponse } from '../dtos';

export const TEAM_MEDIA_TOKEN = 'ITeamMedia';

export interface ITeamMedia {
    uploadTeamAvatar(
        teamId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ): Promise<FileUploadResponse>;
    uploadTeamBanner(
        teamId: string,
        file: FileUploadDto,
        updateFn: (url: string) => Promise<boolean>,
    ): Promise<FileUploadResponse>;
}
