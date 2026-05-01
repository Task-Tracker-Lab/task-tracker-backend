import { IUserRepository } from '@core/user/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class FindProfileQuery {
    constructor(
        @Inject('IUserRepository')
        private readonly userRepo: IUserRepository,
    ) {}

    async execute(userId: string) {
        const { user, notifications, security } = await this.userRepo.findProfile(userId);

        if (!user) {
            throw new BaseException(
                { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' },
                HttpStatus.NOT_FOUND,
            );
        }

        const { id, email, ...profile } = user;
        return { id, email, profile, security, notifications };
    }
}
