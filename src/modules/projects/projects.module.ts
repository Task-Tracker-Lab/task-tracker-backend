import { Module } from '@nestjs/common';
import { NestedProjectsService, ProjectsService } from './services';
import { NestedProjectsController, ProjectsController } from './controller';
import { ProjectsRepository } from './repository';

const REPOSITORY = {
    provide: 'IProjectsRepository',
    useClass: ProjectsRepository,
};

@Module({
    imports: [],
    controllers: [ProjectsController, NestedProjectsController],
    providers: [REPOSITORY, NestedProjectsService, ProjectsService],
})
export class ProjectsModule {}
