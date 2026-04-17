import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/modules/app/app.module';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

describe('App (e2e)', () => {
    let app: NestFastifyApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('/health (GET)', async () => {
        const res = await app.inject({
            method: 'GET',
            url: '/health',
        });

        expect(res.statusCode).toBe(200);
        expect(res.payload).toBe('healthy');
    });
});
