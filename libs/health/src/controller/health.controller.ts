import { Controller, Get, HttpStatus, Inject, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from '../health.service';
import { GetHealthSwagger, GetPingSwagger } from './health.swagger';
import { ApiTags } from '@nestjs/swagger';
import { BaseException } from '@shared/error';

@SkipThrottle()
@Controller()
@ApiTags('System')
export class HealthController {
    private logger = new Logger(HealthController.name);

    constructor(
        private readonly healthService: HealthService,
        @Inject('SERVICE_NAME') private readonly serviceName: string,
    ) {}

    @Get('health')
    @GetHealthSwagger()
    async checkHealth() {
        const pingData = await this.healthService.getHealthData();

        if (pingData.status !== 'up') {
            this.logger.error(`${this.serviceName} is unhealthy!`);
            throw new BaseException(
                {
                    code: 'SERVICE_UNHEALTHY',
                    message: `Сервис ${this.serviceName} временно недоступен или работает некорректно`,
                    details: [
                        {
                            target: this.serviceName,
                            status: pingData.status,
                            timestamp: new Date().toISOString(),
                        },
                    ],
                },
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }

        return 'healthy';
    }

    @Get('ping')
    @GetPingSwagger()
    async ping() {
        return this.healthService.getHealthData();
    }
}
