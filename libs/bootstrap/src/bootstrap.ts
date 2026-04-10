import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { setupThrottler } from './setups/throttler';
import { DEFAULT_THROTTLER_OPTIONS } from './configs/throttler';
import { setupCors, setupSwagger } from './setups';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { BootstrapOptions } from './interfaces/options.interface';
import fastifyCookie from '@fastify/cookie';
import fastifyCompress from '@fastify/compress';

export async function bootstrapApp(options: BootstrapOptions) {
    const adapter = new FastifyAdapter();

    const {
        appModule,
        apiPrefix = 'api/v1',
        serviceName = 'App',
        portEnvKey = 'PORT',
        defaultPort = 3000,
        setupApp,
        useCookieParser = true,
        useCors = true,
        throttlerOptions = DEFAULT_THROTTLER_OPTIONS,
        swaggerOptions,
    } = options;

    let rootModule = appModule;

    // TODO: Improve merging modules (in case of multiple features needed)
    if (throttlerOptions) {
        rootModule = setupThrottler(rootModule, throttlerOptions);
    }

    const app = await NestFactory.create<NestFastifyApplication>(rootModule, adapter, {
        rawBody: true,
    });
    const logger = new Logger(serviceName[0].toUpperCase() + serviceName.slice(1));
    const configService = app.get(ConfigService);
    const port = configService.getOrThrow<number>(portEnvKey, defaultPort);
    const origins = configService.getOrThrow('CORS_ALLOWED_ORIGINS');

    app.enableShutdownHooks();

    await app.register(fastifyCompress, {
        global: true,
        threshold: 1024,
    });

    if (apiPrefix) app.setGlobalPrefix(apiPrefix);
    if (useCors) setupCors(app, origins);
    if (swaggerOptions) {
        const { path = 'docs', ...metadata } = swaggerOptions;

        const domain = configService.get('DOMAIN');
        const stage = configService.get('STAGE_DOMAIN');

        const fullOptions = {
            ...metadata,
            path,
            server: {
                port,
                domain,
                stage,
            },
        };

        await setupSwagger(app, fullOptions);
    }
    if (useCookieParser) app.register(fastifyCookie, { secret: 'SAME-SECRET' });
    if (setupApp) setupApp(app);

    await app.listen(port, '0.0.0.0', (_err, address) => {
        if (_err) {
            logger.error(_err);
            process.exit(1);
        }

        logger.verbose(`Application is running on: ${address}${apiPrefix ? '/' + apiPrefix : ''}`);
    });
}
