import { bootstrapApp } from '@libs/bootstrap';
import { AppModule } from './modules/app/app.module';

bootstrapApp({
    serviceName: 'Tracker Monolit',
    appModule: AppModule,
    apiPrefix: 'api/v1',
    defaultPort: 2000,
    portEnvKey: 'PORT',
    swaggerOptions: {
        title: 'Task Tracker API',
        description: 'API бэкенда таск-трекера',
        version: '0.1.0',
        path: 'docs',
    },
    useCors: true,
    useCookieParser: true,
});
