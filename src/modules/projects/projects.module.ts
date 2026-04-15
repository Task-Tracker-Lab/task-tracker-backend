import { Module } from '@nestjs/common';
import { ProjectsService } from './services';
import { ProjectsController } from './controller';
import { ProjectsRepository } from './repository';

const REPOSITORY = {
    provide: 'IProjectsRepository',
    useClass: ProjectsRepository,
};

@Module({
    imports: [],
    controllers: [ProjectsController],
    providers: [REPOSITORY, ProjectsService],
})
export class ProjectsModule {}
