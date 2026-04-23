import { bootstrapApp } from '@libs/bootstrap';
import { AppModule } from './modules/app/app.module';

bootstrapApp({
    serviceName: 'Tracker Monolit',
    appModule: AppModule,
    version: 'v1',
    defaultPort: 2000,
    portEnvKey: 'PORT',
    swaggerOptions: {
        title: 'Task Tracker API',
        description: `
### Описание
RESTful API сервиса управления задачами (Task Tracker).

### Поддержка
Для доступа к закрытым методам используйте заголовок Authorization: Bearer token.
По вопросам интеграции обращаться к команде разработки.
    `.trim(),
        version: '0.1.0',
        path: 'docs',
    },
    useCors: true,
    useCookieParser: true,
});
