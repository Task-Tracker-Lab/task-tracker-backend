import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@libs/config';
import { DatabaseModule } from '@libs/database';
import { ConfigService } from '@nestjs/config';
import * as schema from './shared/entities';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe, ZodValidationException } from 'nestjs-zod';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

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
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_PIPE,
            useClass: ZodValidationPipe,
        },
        {
            provide: APP_FILTER,
            useClass: ZodValidationException,
        },
    ],
})
export class AppModule {}
