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
import { MediaModule } from '@core/modules/media';
import { TeamsFacade } from './application/team.facade';

import * as UC from './application/use-cases';

const REPOSITORY = { provide: 'ITeamsRepository', useClass: TeamsRepository };

const QUERIES = [
    UC.FindTeamQuery,
    UC.FindTeamMemberQuery,
    UC.GetInvitationQuery,
    UC.GetInvitationsQuery,
    UC.GetTeamMembersQuery,
    UC.GetMyInvitesUseCase,
    UC.GetMyTeamsUseCase,
    UC.GetUserInvitesUseCase,
    UC.GetAllTagsUseCase,
    UC.CheckTeamSlugQuery,
];

const USE_CASES = [
    UC.CreateTeamUseCase,
    UC.DeleteTeamUseCase,
    UC.UpdateTeamUseCase,
    UC.UpdateTeamAvatarUseCase,
    UC.UpdateTeamBannerUseCase,
    UC.SyncTeamTagsUseCase,
    UC.UpdateTeamMemberUseCase,
    UC.RemoveTeamMemberUseCase,
    UC.SendInvitationUseCase,
    UC.AcceptInvitationUseCase,
    UC.UpdateInvitationUseCase,
    UC.DeclineInvitationUseCase,
];

const EXTERNAL_USE_CASES = [UC.FindTeamMemberQuery, UC.FindTeamQuery];

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
    providers: [REPOSITORY, ...USE_CASES, ...QUERIES, TeamsFacade],
    exports: [...EXTERNAL_USE_CASES],
})
export class TeamsModule {}
