import { IStateRepository } from '@core/area/domain/repository';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ReorderStatesUseCase {
    constructor(
        @Inject('IStateRepository')
        private readonly stateRepo: IStateRepository,
    ) {}

    async execute(areaId: string) {
        return this.stateRepo.reorder(areaId);
    }
}
