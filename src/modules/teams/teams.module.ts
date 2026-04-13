import { Module } from '@nestjs/common';
import { TeamsController } from './controller';
import { TeamsService } from './services';
import { TeamsRepository } from './repository';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

@Module({
    imports: [],
    controllers: [TeamsController],
    providers: [REPOSITORY, TeamsService],
})
export class TeamsModule {}
