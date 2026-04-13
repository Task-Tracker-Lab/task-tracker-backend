import { JwtPayload } from './jwt-payload.type';

declare module 'fastify' {
    interface FastifyRequest {
        user?: JwtPayload;
    }
}
