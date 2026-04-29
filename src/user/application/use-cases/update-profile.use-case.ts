import { IUserRepository } from '@core/user/domain/repository';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { UpdateProfileDto } from '../dtos';
import { BaseException } from '@shared/error';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class UpdateProfileUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(id: string, dto: UpdateProfileDto) {
        const isUpdated = await this.userRepo.updateProfile(id, dto);

        if (!isUpdated) {
            throw new BaseException(
                { code: 'PROFILE_UPDATE_FAILED', message: 'Не удалось обновить данные' },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        await this.userRepo.logActivity({
            id: createId(),
            userId: id,
            eventType: 'PROFILE_UPDATED',
        });

        return { success: true };
    }
}
