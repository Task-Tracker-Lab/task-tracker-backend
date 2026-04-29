import { ITeamsRepository } from '@core/teams/domain/repository';
import { TeamMemberMapper } from '@core/teams/application/mappers';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetMyTeamsUseCase {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(userId: string, pagination: Record<string, string>) {
        const teams = await this.teamsRepo.findByUser(userId, pagination);
        return teams.map((t) => TeamMemberMapper.toUserTeam(t));
    }
}
