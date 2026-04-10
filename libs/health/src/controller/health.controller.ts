import { Controller, Get, HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from '../health.service';
import { GetHealthSwagger, GetPingSwagger } from './health.swagger';
import { ApiTags } from '@nestjs/swagger';

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
            throw new HttpException(
                `${this.serviceName} service is unhealthy.`,
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
