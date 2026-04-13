import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { S3_OPTIONS } from './s3.constants';
import { S3ModuleOptions } from './interfaces';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    public readonly bucket: string;
    private readonly endpoint: string;

    constructor(
        @Inject(S3_OPTIONS)
        private readonly options: S3ModuleOptions,
    ) {
        const { bucket, credentials, endpoint, region } = options.connection;
        this.bucket = bucket;
        this.endpoint = endpoint as string;

        this.s3Client = new S3Client({
            region,
            endpoint,
            credentials,
            ...options.config,
        });
    }

    async uploadPublicFile(
        fileBuffer: Buffer,
        originalName: string,
        mimetype: string,
    ): Promise<string> {
        const extension = extname(originalName);
        const fileName = `${randomUUID()}${extension}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimetype,
        });

        await this.s3Client.send(command);

        return `${this.endpoint}/${this.bucket}/${fileName}`;
    }
}
