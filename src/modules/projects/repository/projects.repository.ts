import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { Injectable, Inject } from '@nestjs/common';
import * as schema from '../entities';
import { IProjectsRepository } from './projects.repository.interface';

@Injectable()
export class ProjectsRepository implements IProjectsRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}
}
