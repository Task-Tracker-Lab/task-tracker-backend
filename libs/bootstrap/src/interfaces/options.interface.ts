import type { Config } from '@libs/config';
import type { Type } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export interface SwaggerMetadata {
    title?: string;
    description?: string;
    version?: string;
    path?: string;
}

export interface SwaggerInfrastructure {
    server?: {
        port?: string | number;
        domain?: string;
        stage?: string;
    };
    services?: { name: string; port: number }[];
}

export interface SwaggerOptions extends SwaggerMetadata, SwaggerInfrastructure {}

export interface BootstrapOptions {
    apiPrefix?: string;
    appModule: Type<unknown>;
    defaultPort?: number;
    portEnvKey?: keyof Config;
    serviceName: string;
    setupApp?: (app: NestFastifyApplication) => Promise<void> | void;
    swaggerOptions?: SwaggerMetadata;
    throttlerOptions?: ThrottlerModuleOptions;
    useCookieParser?: boolean;
    useCors?: boolean;
}
