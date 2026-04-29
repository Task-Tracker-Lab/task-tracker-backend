import { FileUploadDto, IUserMedia, USER_MEDIA_TOKEN } from '@core/modules/media';
import { IUserRepository } from '@core/user/domain/repository';
import { Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class UploadAvatarUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
        @Inject(USER_MEDIA_TOKEN)
        private readonly mediaService: IUserMedia,
    ) {}

    async execute(userId: string, fileDto: FileUploadDto) {
        const { url } = await this.mediaService.uploadUserAvatar(userId, fileDto, (url) =>
            this.userRepo.updateAvatar(userId, url),
        );

        await this.userRepo.logActivity({
            id: createId(),
            userId,
            eventType: 'AVATAR_CHANGED',
            metadata: { url },
        });

        return { success: true, url };
    }
}
