import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { S3Module } from '@libs/s3';
import { USER_MEDIA_TOKEN } from './interfaces/user-media.interface';
import { TEAM_MEDIA_TOKEN } from './interfaces/team-media.interface';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        S3Module.registerAsync({
            inject: [ConfigService],
            useFactory: (cfg: ConfigService) => ({
                connection: {
                    bucket: cfg.getOrThrow('S3_BUCKET_NAME'),
                    endpoint: cfg.getOrThrow('S3_ENDPOINT'),
                    region: cfg.getOrThrow('S3_REGION'),
                    credentials: {
                        accessKeyId: cfg.getOrThrow('S3_ACCESS_KEY'),
                        secretAccessKey: cfg.getOrThrow('S3_SECRET_KEY'),
                    },
                },
                // FOR MINIO COMPARTABLE
                config: { forcePathStyle: true },
            }),
        }),
    ],
    providers: [
        MediaService,
        {
            provide: USER_MEDIA_TOKEN,
            useExisting: MediaService,
        },
        {
            provide: TEAM_MEDIA_TOKEN,
            useExisting: MediaService,
        },
    ],
    exports: [USER_MEDIA_TOKEN, TEAM_MEDIA_TOKEN],
})
export class MediaModule {}
