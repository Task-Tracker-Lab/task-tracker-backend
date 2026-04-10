import { Inject, Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class HealthService {
    private readonly startTime: Date;

    constructor(
        @Inject('SERVICE_NAME')
        private readonly serviceName: string,
    ) {
        this.startTime = new Date();
    }

    async getHealthData() {
        const uptimeSeconds = Math.floor(process.uptime());
        const mem = process.memoryUsage();

        return {
            service: this.serviceName,
            status: 'up',
            info: {
                version: '1.0.0',
                node: process.version,
                pid: process.pid,
            },
            time: {
                now: new Date().toISOString(),
                startedAt: this.startTime.toISOString(),
                uptime: this.formatUptime(uptimeSeconds),
                uptimeSeconds: uptimeSeconds,
            },
            metrics: {
                rss: this.toMb(mem.rss),
                heapUsed: this.toMb(mem.heapUsed),
                loadAverage: os.loadavg()[0].toFixed(2),
            },
        };
    }

    private toMb(bytes: number) {
        return `${Math.round(bytes / 1024 / 1024)}MB`;
    }

    private formatUptime(seconds: number) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
    }
}
