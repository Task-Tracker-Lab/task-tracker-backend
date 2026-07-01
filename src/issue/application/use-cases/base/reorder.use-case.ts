import { IIssueRepository } from '@core/issue/domain/repositories';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ReorderIssuesUseCase {
    constructor(
        @Inject('IIssueRepository')
        private readonly issueRepo: IIssueRepository,
    ) {}

    execute(stateId: string) {
        return this.issueRepo.reorder(stateId);
    }
}
