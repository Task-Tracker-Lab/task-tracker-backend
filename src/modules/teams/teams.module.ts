import { Module } from '@nestjs/common';
import { MembersController, TeamsController } from './controller';
import { TeamsService } from './services';
import { TeamsRepository } from './repository';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

@Module({
    imports: [],
    controllers: [TeamsController, MembersController],
    providers: [REPOSITORY, TeamsService],
})
export class TeamsModule {}
