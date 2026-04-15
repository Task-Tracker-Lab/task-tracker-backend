import { Module } from '@nestjs/common';
import { ProjectsService } from './services';
import { ProjectsController } from './controller';

@Module({
    imports: [],
    controllers: [ProjectsController],
    providers: [ProjectsService],
})
export class ProjectsModule {}
