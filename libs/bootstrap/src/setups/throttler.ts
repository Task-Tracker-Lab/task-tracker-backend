import { Module, type Type } from '@nestjs/common';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

export function setupThrottler(module: Type<unknown>, options: ThrottlerModuleOptions) {
    @Module({
        imports: [module, ThrottlerModule.forRoot(options)],
        providers: [
            {
                provide: APP_GUARD,
                useClass: ThrottlerGuard,
            },
        ],
    })
    class RootModule {}

    return RootModule;
}
