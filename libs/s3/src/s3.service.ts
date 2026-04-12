import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_OPTIONS } from './s3.constants';
import { S3ModuleOptions } from './interfaces';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    public readonly bucket: string;

    constructor(
        @Inject(S3_OPTIONS)
        private readonly options: S3ModuleOptions,
    ) {
        const { bucket, credentials, endpoint, region } = options.connection;
        this.bucket = bucket;

        this.s3Client = new S3Client({
            region,
            endpoint,
            credentials,
            ...options.config,
        });
    }
}
