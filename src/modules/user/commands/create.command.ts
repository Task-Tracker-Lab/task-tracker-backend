import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import { NewUser } from '../entities/user.domain';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class CreateUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(dto: NewUser & { password: string }) {
        const existingUser = await this.repository.findByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException(`User with email ${dto.email} already exists`);
        }

        const user = await this.repository.create(dto);
        await this.repository.logActivity({
            eventType: 'registered',
            userId: user.id,
            id: createId(),
        });
        await this.repository.updatePasswordHash(user.id, dto.password);
        return user;
    }
}
