import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../repository';

@Injectable()
export class FindTeamCommand {
    constructor(
        @Inject('ITeamsRepository')
        private readonly repository: ITeamsRepository,
    ) {}

    async execute(slug: string) {
        return this.repository.findBySlug(slug);
    }
}
