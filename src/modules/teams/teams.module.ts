import { Module } from '@nestjs/common';
import { MembersController, TeamsController } from './controller';
import { TeamsService } from './services';
import { TeamsRepository } from './repository';
import { MediaModule } from '../media/media.module';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

@Module({
    imports: [MediaModule],
    controllers: [TeamsController, MembersController],
    providers: [REPOSITORY, TeamsService],
})
export class TeamsModule {}
