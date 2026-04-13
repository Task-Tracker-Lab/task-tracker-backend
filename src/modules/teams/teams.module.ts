import { Module } from '@nestjs/common';
import { TeamsController } from './controller';
import { TeamsService } from './services';

@Module({
    imports: [],
    controllers: [TeamsController],
    providers: [TeamsService],
    exports: [],
})
export class TeamsModule {}
