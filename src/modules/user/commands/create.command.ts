import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import { NewUser } from '../entities/user.domain';
import { createId } from '@paralleldrive/cuid2';
import { BaseException } from '@shared/error';

@Injectable()
export class CreateUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(dto: NewUser & { password: string }) {
        const existingUser = await this.repository.findByEmail(dto.email);

        if (existingUser) {
            throw new BaseException(
                {
                    code: 'USER_ALREADY_EXISTS',
                    message: `Пользователь с email ${dto.email} уже зарегистрирован`,
                    details: [{ target: 'email', value: dto.email }],
                },
                HttpStatus.CONFLICT,
            );
        }

        try {
            const user = await this.repository.create(dto);

            await this.repository.logActivity({
                eventType: 'registered',
                userId: user.id,
                id: createId(),
            });

            await this.repository.updatePasswordHash(user.id, dto.password);

            return user;
        } catch (error) {
            throw new BaseException(
                {
                    code: 'USER_REGISTRATION_FAILED',
                    message: 'Не удалось завершить регистрацию пользователя',
                    details: [
                        { reason: error instanceof Error ? error.message : 'Database error' },
                    ],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
