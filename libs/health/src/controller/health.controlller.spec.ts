import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthController } from './health.controller';
import { HttpStatus, Logger } from '@nestjs/common';

describe('HealthController', () => {
    let controller: HealthController;
    let healthServiceMock: { getHealthData: ReturnType<typeof vi.fn> };
    const SERVICE_NAME = 'MyService';
    beforeEach(() => {
        healthServiceMock = {
            getHealthData: vi.fn(),
        };
        controller = new HealthController(healthServiceMock as any, SERVICE_NAME);

        vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    describe('checkHealth', () => {
        it('should return "healthy" when service status is "up"', async () => {
            healthServiceMock.getHealthData.mockResolvedValue({ status: 'up' });

            await expect(controller.checkHealth()).resolves.toBe('healthy');
        });

        it('should throw SERVICE_UNAVAILABLE when service status is "down"', async () => {
            healthServiceMock.getHealthData.mockResolvedValue({ status: 'down' });

            await expect(controller.checkHealth()).rejects.toMatchObject({
                status: HttpStatus.SERVICE_UNAVAILABLE,
                response: `${SERVICE_NAME} service is unhealthy.`,
            });
        });
    });

    describe('ping', () => {
        it('should return the full health payload', async () => {
            const mockPayload = { status: 'up' };
            healthServiceMock.getHealthData.mockResolvedValue(mockPayload);

            const result = await controller.ping();

            expect(result).toEqual(mockPayload);
            expect(healthServiceMock.getHealthData).toHaveBeenCalledTimes(1);
        });
    });
});
