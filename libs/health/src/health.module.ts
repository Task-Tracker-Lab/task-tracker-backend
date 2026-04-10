import { type DynamicModule, Global, Module } from '@nestjs/common';
import { HealthController } from './controller/health.controller';
import { HealthService } from './health.service';

@Global()
@Module({})
export class HealthModule {
    static register(serviceName: string): DynamicModule {
        return {
            module: HealthModule,
            providers: [
                {
                    provide: 'SERVICE_NAME',
                    useValue: serviceName,
                },
                HealthService,
            ],
            controllers: [HealthController],
        };
    }
}
