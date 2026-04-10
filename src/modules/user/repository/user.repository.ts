import * as users from '../entities';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { IUserRepository } from './user.repository.interface';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly repository: DatabaseService<typeof users>,
    ) {}
}
