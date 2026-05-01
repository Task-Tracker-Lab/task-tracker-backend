import { Injectable } from '@nestjs/common';
import {
    FindProfileQuery,
    GetActivityQuery,
    UpdateNotificationsUseCase,
    UpdateProfileUseCase,
    UploadAvatarUseCase,
} from './use-cases';
import { UpdateProfileDto, UpdateNotificationsDto } from './dtos';
import { FileUploadDto } from '@shared/media';

@Injectable()
export class UserFacade {
    constructor(
        private readonly findProfileQuery: FindProfileQuery,
        private readonly getActivityQuery: GetActivityQuery,
        private readonly updateNotificationsUC: UpdateNotificationsUseCase,
        private readonly updateProfileUC: UpdateProfileUseCase,
        private readonly uploadAvatarUC: UploadAvatarUseCase,
    ) {}

    public async getProfile(userId: string) {
        return this.findProfileQuery.execute(userId);
    }

    public async getActivity(userId: string, page: number, limit: number) {
        return this.getActivityQuery.execute(userId, page, limit);
    }

    public async updateProfile(userId: string, dto: UpdateProfileDto) {
        return this.updateProfileUC.execute(userId, dto);
    }

    public async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
        return this.updateNotificationsUC.execute(userId, dto);
    }

    public async uploadAvatar(userId: string, file: FileUploadDto) {
        return this.uploadAvatarUC.execute(userId, file);
    }
}
