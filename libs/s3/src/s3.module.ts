import { type DynamicModule, Module, type Provider } from '@nestjs/common';
import type { S3ModuleOptions, S3ModuleAsyncOptions } from './interfaces';
import { S3Service } from './s3.service';
import { S3_OPTIONS } from './s3.constants';

@Module({})
export class S3Module {
    static register(options: S3ModuleOptions): DynamicModule {
        const { global, ...config } = options;

        return {
            global,
            module: S3Module,
            providers: [{ provide: S3_OPTIONS, useValue: config }, S3Service],
            exports: [S3Service],
        };
    }

    static registerAsync(options: S3ModuleAsyncOptions): DynamicModule {
        const { imports } = options;

        return {
            module: S3Module,
            imports: imports || [],
            providers: [this.createAsyncOptionsProvider(options), S3Service],
            exports: [S3Service],
        };
    }

    private static createAsyncOptionsProvider(options: S3ModuleAsyncOptions): Provider {
        return {
            provide: S3_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject || [],
        };
    }
}
