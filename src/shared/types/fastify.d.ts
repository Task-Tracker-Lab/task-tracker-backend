import type { JwtPayload } from './jwt-payload';

declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
    }
}
