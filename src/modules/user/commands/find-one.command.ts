import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';
import { User, UserWithPassword } from '../entities/user.domain';

@Injectable()
export class FindOneUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(params: { email: string }): Promise<UserWithPassword | null>;
    async execute(params: { id: string }): Promise<User | null>;
    async execute(params: { email?: string; id?: string }): Promise<any> {
        const { email, id } = params;

        if (email) {
            return this.repository.findByEmail(email);
        }

        if (id) {
            return this.repository.findById(id);
        }

        throw new Error('FindOneUserCommand: email or id must be provided');
    }
}
