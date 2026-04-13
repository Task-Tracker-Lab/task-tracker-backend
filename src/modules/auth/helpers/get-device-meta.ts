import type { FastifyRequest } from 'fastify';
import { UAParser } from 'ua-parser-js';

export interface DeviceMetadata {
    ip: string;
    userAgent: string;
    browser: string;
    os: string;
    deviceType: 'mobile' | 'desktop' | 'tablet';
}

export function getDeviceMeta(req: FastifyRequest): DeviceMetadata {
    const uaString = req.headers['user-agent'] || '';
    const parser = new UAParser(uaString);
    const res = parser.getResult();

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '0.0.0.0';

    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (res.device.type === 'mobile') deviceType = 'mobile';
    if (res.device.type === 'tablet') deviceType = 'tablet';

    return {
        ip,
        userAgent: uaString,
        browser: `${res.browser.name || 'Unknown'} ${res.browser.version || ''}`.trim(),
        os: `${res.os.name || 'Unknown'} ${res.os.version || ''}`.trim(),
        deviceType,
    };
}
