import { AreaModule } from '@core/area';
import { IssueQueue } from '@core/issue/domain/enums';
import { ProjectModule } from '@core/project';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CONTROLLERS } from './application/controllers';
import { IssueFacade } from './application/issue.facade';
import { USE_CASES } from './application/use-cases';
import { REPOSITORIES } from './infrastructure/persistence/repositories';

@Module({
    imports: [AreaModule, ProjectModule, BullModule.registerQueue({ name: IssueQueue.ISSUE })],
    controllers: CONTROLLERS,
    providers: [...REPOSITORIES, ...USE_CASES, IssueFacade],
})
export class IssueModule {}
