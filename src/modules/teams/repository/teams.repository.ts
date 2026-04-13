import { Inject } from '@nestjs/common';
import { ITeamsRepository } from './teams.repository.interface';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import * as schema from '../entities';

export class TeamsRepository implements ITeamsRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}
}
