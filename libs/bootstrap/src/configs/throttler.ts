import type { ThrottlerModuleOptions } from '@nestjs/throttler';

export const DEFAULT_THROTTLER_OPTIONS: ThrottlerModuleOptions = [
  {
    ttl: 60000,
    limit: 100,
    skipIf: (context) => context.getType() !== 'http',
  },
];
