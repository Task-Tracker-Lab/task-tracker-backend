import { forwardRef, Module } from '@nestjs/common';
import { ProjectsService } from './services';
import { ProjectsController } from './controller';
import { ProjectsRepository } from './repository';
import { TeamsModule } from '../teams';
import { FindProjectCommand } from './commands';

const REPOSITORY = {
    provide: 'IProjectsRepository',
    useClass: ProjectsRepository,
};

@Module({
    imports: [forwardRef(() => TeamsModule)],
    controllers: [ProjectsController],
    providers: [REPOSITORY, FindProjectCommand, ProjectsService],
    exports: [FindProjectCommand],
})
export class ProjectsModule {}
