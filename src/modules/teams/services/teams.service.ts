import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';

@Injectable()
export class TeamsService {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}
}
