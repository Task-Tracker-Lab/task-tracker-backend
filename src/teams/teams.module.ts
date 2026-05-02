import { Module } from '@nestjs/common';
import {
    TeamsInvitationsController,
    TeamsSettingsController,
    TeamsMembersController,
    TeamsController,
    MeController,
} from './application/controller';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TeamsRepository } from './infrastructure/persistence/repositories';
import { TeamQueues } from './domain/enums';
import { TeamsFacade } from './application/team.facade';
import { TeamQueries, TeamUseCases, TEAM_EXTERNAL_QUERIES } from './application/use-cases';
import { MediaModule } from '@shared/media';
import { TeamMemberPolicy } from './domain/policy';
import { MailProcessor } from '@core/teams/infrastructure/workers';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

@Module({
    imports: [
        MediaModule,
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (cfg: ConfigService) => {
                const host = cfg.getOrThrow('REDIS_HOST', { infer: true });
                const port = cfg.get('REDIS_PORT');
                const password = cfg.get('REDIS_PASSWORD');
                const url = `redis://${host}${port ? `:${port}` : ''}`;

                return {
                    type: 'single',
                    url,
                    options: {
                        password,
                        retryStrategy(times) {
                            return Math.min(times * 50, 2000);
                        },
                        commandTimeout: 3000,
                    },
                };
            },
        }),
        BullModule.registerQueue({
            name: TeamQueues.TEAM_MAIL,
        }),
        BullBoardModule.forFeature({
            name: TeamQueues.TEAM_MAIL,
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
        TeamMemberPolicy,
        REPOSITORY,
        ...TeamUseCases,
        ...TeamQueries,
        TeamsFacade,
        MailProcessor,
    ],
    exports: [...TEAM_EXTERNAL_QUERIES],
})
export class TeamsModule {}
