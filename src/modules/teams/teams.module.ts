import { Module } from '@nestjs/common';
import {
    TeamsInvitationsController,
    TeamsSettingsController,
    TeamsMembersController,
    TeamsController,
    MeController,
} from './controller';
import { MediaModule } from '../media/media.module';
import {
    MeService,
    TeamsService,
    TeamMembersService,
    TeamsSettingsService,
    TeamInvitationsService,
} from './services';
import { TeamsRepository } from './repository';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { Queues } from '@shared/workers';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

@Module({
    imports: [
        MediaModule,
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (cfg: ConfigService) => {
                const host = cfg.getOrThrow('REDIS_HOST', { infer: true });
                const port = cfg.get('REDIS_PORT');
                const url = `redis://${host}${port ? `:${port}` : ''}`;

                return {
                    type: 'single',
                    url,
                    options: {
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        },
                        commandTimeout: 3000,
                    },
                };
            },
        }),
        BullModule.registerQueue({
            name: Queues.MAIL,
        }),
        BullBoardModule.forFeature({
            name: Queues.MAIL,
            adapter: BullMQAdapter,
        }),
    ],
    controllers: [
        TeamsInvitationsController,
        TeamsSettingsController,
        TeamsMembersController,
        TeamsController,
        MeController,
    ],
    providers: [
        REPOSITORY,
        MeService,
        TeamsService,
        TeamMembersService,
        TeamsSettingsService,
        TeamInvitationsService,
    ],
})
export class TeamsModule {}
