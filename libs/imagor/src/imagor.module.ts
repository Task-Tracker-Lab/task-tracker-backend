import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './imagor.module-definition';
import { ImagorService } from './imagor.service';

@Module({
    providers: [ImagorService],
    exports: [ImagorService],
})
export class ImagorModule extends ConfigurableModuleClass {}
