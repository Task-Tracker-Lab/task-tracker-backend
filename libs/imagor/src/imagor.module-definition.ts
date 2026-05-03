import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { ImagorModuleOptions } from './interfaces';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
    new ConfigurableModuleBuilder<ImagorModuleOptions>()
        .setClassMethodName('forRoot')
        .setExtras(
            {
                global: true,
            },
            (definition, extras) => ({
                ...definition,
                global: extras.global,
            }),
        )
        .build();
