import { StateQueues } from '@core/area/domain/enums';
import { ProjectModule } from '@core/project';
import { BullModule } from '@nestjs/bullmq';
import { forwardRef, Module } from '@nestjs/common';

import { AreaFacade } from './application/area.facade';
import { CONTROLLERS } from './application/controllers';
import { GetAreaQuery, GetStateQuery, USE_CASES } from './application/use-cases';
import { AreaQueues } from './domain/enums/area-jobs.enum';
import { REPOSITORIES } from './infrastructure/persistence/repositories';
import { AreaProcessor } from './infrastructure/workers/area.processor';

@Module({
    imports: [
        BullModule.registerQueue({ name: AreaQueues.AREA_WORKSPACE }, { name: StateQueues.STATE }),
        forwardRef(() => ProjectModule),
    ],
    controllers: [...CONTROLLERS],
    providers: [...REPOSITORIES, ...USE_CASES, AreaFacade, AreaProcessor],
    exports: [GetAreaQuery, GetStateQuery],
})
export class AreaModule {}
