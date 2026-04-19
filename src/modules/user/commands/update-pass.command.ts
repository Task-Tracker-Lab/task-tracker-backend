import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import { BaseException } from '@shared/error';

@Injectable()
export class UpdatePassUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(email: string, password: string) {
        const { user } = await this.repository.findByEmail(email);

        if (!user) {
            throw new BaseException(
                {
                    code: 'USER_NOT_FOUND',
                    message: 'Пользователь для обновления пароля не найден',
                    details: [{ target: 'email', value: email }],
                },
                HttpStatus.NOT_FOUND,
            );
        }

        try {
            const isUpdated = await this.repository.updatePasswordHash(user.id, password);

            if (!isUpdated) {
                throw new BaseException(
                    {
                        code: 'PASSWORD_UPDATE_FAILED',
                        message: 'Не удалось обновить пароль. Запись не была изменена.',
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return isUpdated;
        } catch (error) {
            throw new BaseException(
                {
                    code: 'DATABASE_ERROR',
                    message: 'Произошла критическая ошибка при работе с базой данных',
                    details: [
                        {
                            reason: error instanceof Error ? error.message : 'Unknown DB error',
                        },
                    ],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
