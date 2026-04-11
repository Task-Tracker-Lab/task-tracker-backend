import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository } from '../repository/user.repository.interface';

@Injectable()
export class FindOneUserCommand {
    constructor(
        @Inject('IUserRepository')
        private readonly repository: IUserRepository,
    ) {}

    async execute(email: string) {
        return await this.repository.findByEmail(email);
    }
}
