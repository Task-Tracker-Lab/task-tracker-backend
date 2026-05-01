import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../../../domain/repository';

@Injectable()
export class FindTeamMemberQuery {
    constructor(
        @Inject('ITeamsRepository')
        private readonly repository: ITeamsRepository,
    ) {}

    async execute(teamId: string, userId: string) {
        return this.repository.findMember(teamId, userId);
    }
}
