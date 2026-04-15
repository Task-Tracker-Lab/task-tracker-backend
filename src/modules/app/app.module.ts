import { Module } from '@nestjs/common';
import { ConfigModule } from '@libs/config';
import { DatabaseModule } from '@libs/database';
import { ConfigService } from '@nestjs/config';
import * as schema from '../../shared/entities';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HealthModule } from '@libs/health';
import { UserModule } from '../user';
import { GlobalExceptionFilter } from 'src/shared/error';
import { AuthModule } from '../auth';
import { BullBoardModule } from '@bull-board/nestjs';
import { FastifyAdapter } from '@bull-board/fastify';
import { MailProcessor } from 'src/shared/workers';
import { BullModule } from '@nestjs/bullmq';
import { MailAdapter } from 'src/shared/adapters/mail';
import { MigrationService } from 'src/shared/migration';
import { TeamsModule } from '../teams';
import { ProjectsModule } from '../projects';

@Module({
    imports: [
        ConfigModule,
        PrometheusModule.registerAsync({
            useFactory: () => ({
                path: 'dump',
                defaultMetrics: {
                    enabled: true,
                },
            }),
        }),
        DatabaseModule.registerAsync({
            global: true,
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => {
                return {
                    schema,
                    schemaName: cfg.getOrThrow('DB_SCHEMA'),
                    logging: true,
                };
            },
        }),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                connection: {
                    host: cfg.getOrThrow('REDIS_HOST'),
                    port: cfg.get('REDIS_PORT'),
                },
            }),
        }),
        AuthModule,
        UserModule,
        TeamsModule,
        ProjectsModule,
        BullBoardModule.forRoot({
            route: '/queues',
            adapter: FastifyAdapter,
        }),
        HealthModule.register('gateway'),
    ],
    providers: [
        MigrationService,
        {
            provide: 'IMailPort',
            useClass: MailAdapter,
        },
        MailProcessor,
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_FILTER,
            useClass: GlobalExceptionFilter,
        },
    ],
})
export class AppModule {}
