import fastifyCors from '@fastify/cors';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function setupCors(app: NestFastifyApplication, origins: string[]) {
    app.getHttpAdapter()
        .getInstance()
        .register(fastifyCors, {
            origin: (origin, callback) => {
                // server-to-server / curl / healthcheck
                if (!origin) {
                    return callback(null, true);
                }

                const { hostname } = new URL(origin);

                if (origins.some((o) => hostname === o || hostname.endsWith(`.${o}`))) {
                    callback(null, origin);
                }

                callback(new Error('Not allowed by CORS'), false);
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
}
