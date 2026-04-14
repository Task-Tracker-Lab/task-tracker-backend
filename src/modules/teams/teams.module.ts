import { Module } from '@nestjs/common';
import { MembersController, TeamsController } from './controller';
import { MediaModule } from '../media/media.module';
import { TeamsService, MembersService } from './services';
import { TeamsRepository } from './repository';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

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
    ],
    controllers: [TeamsController, MembersController],
    providers: [REPOSITORY, TeamsService, MembersService],
})
export class TeamsModule {}
