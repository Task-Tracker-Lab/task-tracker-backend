import { Inject, Injectable } from '@nestjs/common';
import { ITeamsRepository } from '../../domain/repository';

@Injectable()
export class FindTeamQuery {
    constructor(
        @Inject('ITeamsRepository')
        private readonly repository: ITeamsRepository,
    ) {}

    async execute(slug: string) {
        return this.repository.findBySlug(slug);
    }
}
