import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { setupThrottler } from './setups/throttler';
import { DEFAULT_THROTTLER_OPTIONS } from './configs/throttler';
import { setupCors, setupSwagger } from './setups';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import type { BootstrapOptions } from './interfaces/options.interface';
import fastifyCookie from '@fastify/cookie';
import fastifyCompress from '@fastify/compress';
import fastifyMultipart from '@fastify/multipart';
import fastifyCsrf from '@fastify/csrf-protection';
import { createId } from '@paralleldrive/cuid2';

export async function bootstrapApp(options: BootstrapOptions) {
    const startTime = performance.now();
    const adapter = new FastifyAdapter({
        requestIdHeader: 'x-request-id',
        genReqId: (req) => {
            return (req.headers['x-request-id'] as string) || createId();
        },
    });

    const {
        appModule,
        apiPrefix,
        version = 'v1',
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

    await app.register(fastifyMultipart, {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    });

    if (apiPrefix) app.setGlobalPrefix(apiPrefix);
    if (version) {
        const hasV = version.startsWith('v');

        app.enableVersioning({
            type: VersioningType.URI,
            prefix: hasV ? 'v' : '',
            defaultVersion: hasV ? version.slice(1) : version,
        });
    }
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
    if (useCookieParser) {
        const secret = configService.getOrThrow('COOKIE_SECRET');
        await app.register(fastifyCookie, { secret });
        await app.register(fastifyCsrf, {
            cookieOpts: {
                signed: true,
                httpOnly: true,
                sameSite: 'strict',
                secure: configService.getOrThrow('NODE_ENV') === 'production',
            },
        });
    }
    if (setupApp) setupApp(app);

    await app.listen(port, '0.0.0.0', (_err, address) => {
        const prefix = [apiPrefix, version].filter(Boolean).join('/');
        const baseUrl = `${address}${prefix ? '/' + prefix : ''}`;

        const swaggerBase = `${address}${apiPrefix ? '/' + apiPrefix : ''}`;
        const swaggerPath = swaggerOptions?.path ?? 'docs';

        if (_err) {
            logger.error(_err);
            process.exit(1);
        }

        const startupTime = (performance.now() - startTime).toFixed(2);
        logger.verbose(`Environment:     ${process.env.NODE_ENV || 'development'}`);
        logger.verbose(`API Endpoint:    ${baseUrl}`);
        logger.verbose(`Health Check:    ${baseUrl}/health`);
        logger.verbose(`Swagger UI:      ${swaggerBase}/${swaggerPath}`);
        logger.verbose(`OpenAPI (Specs): ${swaggerBase}/${swaggerPath}/s/{json,yaml}`);
        logger.verbose(`Boot Time:       ${startupTime}ms`);
    });
}
