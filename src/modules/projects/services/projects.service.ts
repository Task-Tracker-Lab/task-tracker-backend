import { Inject, Injectable } from '@nestjs/common';
import { IProjectsRepository } from '../repository';

@Injectable()
export class ProjectsService {
    constructor(
        @Inject('IProjectsRepository')
        private readonly projectsRepo: IProjectsRepository,
    ) {}
}
