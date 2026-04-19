import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import type { UserWithSecurity } from '../entities/user.domain';
import { BaseException } from '@shared/error';

@Injectable()
export class FindOneUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(params: { email: string }): Promise<UserWithSecurity | null>;
    async execute(params: { id: string }): Promise<UserWithSecurity | null>;
    async execute(params: { email?: string; id?: string }): Promise<any> {
        const { email, id } = params;

        if (email) {
            return this.repository.findByEmail(email);
        }

        if (id) {
            return this.repository.findById(id);
        }

        throw new BaseException(
            {
                code: 'COMMAND_PARAMS_MISSING',
                message: 'Критическая ошибка: не указаны параметры поиска пользователя',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
