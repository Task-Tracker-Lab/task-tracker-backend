import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';

@Injectable()
export class UpdatePassUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(email: string, password: string) {
        const { user } = await this.repository.findByEmail(email);

        if (!user) {
            throw new NotFoundException({
                code: 'USER_NOT_FOUND',
                message: 'Пользователь для обновления пароля не найден',
                details: { email },
            });
        }

        return this.repository.updatePasswordHash(user.id, password);
    }
}
