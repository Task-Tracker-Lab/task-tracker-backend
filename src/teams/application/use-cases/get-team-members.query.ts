import { ITeamsRepository } from '@core/teams/domain/repository';
import { TeamMemberMapper } from '@core/teams/application/mappers';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BaseException } from '@shared/error';

@Injectable()
export class GetTeamMembersQuery {
    constructor(
        @Inject('ITeamsRepository')
        private readonly teamsRepo: ITeamsRepository,
    ) {}

    async execute(slug: string) {
        const team = await this.teamsRepo.findBySlug(slug);

        if (!team) {
            throw new BaseException(
                { code: 'TEAM_NOT_FOUND', message: `Команда ${slug} не найдена` },
                HttpStatus.NOT_FOUND,
            );
        }

        const members = await this.teamsRepo.findMembers(team.id);
        return TeamMemberMapper.toList(members);
    }
}
