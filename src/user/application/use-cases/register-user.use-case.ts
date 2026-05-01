import type { NewUser } from '@core/user/domain/entities';
import { IUserRepository } from '@core/user/domain/repository';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { BaseException } from '@shared/error';

@Injectable()
export class RegisterUserUseCase {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(dto: NewUser & { password: string }) {
        const existingUser = await this.repository.findByEmail(dto.email);

        if (existingUser?.user) {
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

            await Promise.all([
                this.repository.logActivity({
                    eventType: 'registered',
                    userId: user.id,
                    id: createId(),
                }),
                this.repository.updatePasswordHash(user.id, dto.password),
            ]);

            return user;
        } catch (error) {
            if (error instanceof BaseException) {
                throw error;
            }

            throw new BaseException(
                {
                    code: 'USER_REGISTRATION_FAILED',
                    message: 'Не удалось завершить регистрацию',
                    details: [{ reason: error instanceof Error ? error.message : 'DB error' }],
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
