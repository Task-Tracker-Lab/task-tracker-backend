import type { S3ClientConfig } from '@aws-sdk/client-s3';
import type { FactoryProvider, ModuleMetadata, Provider, Type } from '@nestjs/common';

export interface S3ConnectionOptions extends Pick<
    S3ClientConfig,
    'credentials' | 'endpoint' | 'region'
> {
    bucket: string;
}

export interface S3OtherOptions extends Omit<
    S3ClientConfig,
    'credentials' | 'endpoint' | 'region'
> {}

export interface S3ModuleOptions {
    connection: S3ConnectionOptions;
    config?: S3OtherOptions;
    global?: boolean;
}

export interface S3ModuleOptionsFactory {
    createS3Options(): Promise<S3ModuleOptions> | S3ModuleOptions;
}

export interface S3ModuleAsyncOptions<T extends unknown[] = any[]> extends Pick<
    ModuleMetadata,
    'imports'
> {
    useExisting?: Type<S3ModuleOptionsFactory>;
    useClass?: Type<S3ModuleOptionsFactory>;
    useFactory?: (
        ...args: T
    ) => Promise<Omit<S3ModuleOptions, 'global'>> | Omit<S3ModuleOptions, 'global'>;
    inject?: FactoryProvider['inject'];
    global?: boolean;
    extraProviders?: Provider[];
}
