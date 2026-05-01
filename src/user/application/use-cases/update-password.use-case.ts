import { IUserRepository } from '@core/user/domain/repository';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class UpdatePasswordUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(email: string, password: string) {
        const result = await this.repository.findByEmail(email);

        if (!result?.user) {
            throw new BaseException(
                {
                    code: 'USER_NOT_FOUND',
                    message: 'Пользователь для обновления пароля не найден',
                },
                HttpStatus.NOT_FOUND,
            );
        }

        try {
            const isUpdated = await this.repository.updatePasswordHash(result.user.id, password);

            if (!isUpdated) {
                throw new BaseException(
                    {
                        code: 'PASSWORD_UPDATE_FAILED',
                        message: 'Запись не была изменена',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return isUpdated;
        } catch (error) {
            throw new BaseException(
                {
                    code: 'DATABASE_ERROR',
                    message: 'Ошибка при работе с БД',
                    details: [{ reason: error instanceof Error ? error.message : 'Unknown' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
