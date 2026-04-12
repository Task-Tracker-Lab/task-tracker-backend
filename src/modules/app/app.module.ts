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
import { S3Module } from '@libs/s3';
import { MigrationService } from 'src/shared/migration';

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
        S3Module.registerAsync({
            inject: [ConfigService],
            global: true,
            useFactory: (cfg: ConfigService) => ({
                connection: {
                    bucket: cfg.getOrThrow('S3_BUCKET_NAME'),
                    endpoint: cfg.getOrThrow('S3_ENDPOINT'),
                    credentials: {
                        accessKeyId: cfg.getOrThrow('S3_ACCESS_KEY'),
                        secretAccessKey: cfg.getOrThrow('S3_SECRET_KEY'),
                    },
                },
                // FOR MINIO COMPARTABLE
                config: { forcePathStyle: true },
            }),
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
