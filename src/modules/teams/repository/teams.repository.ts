import { Inject, Logger } from '@nestjs/common';
import { ITeamsRepository } from './teams.repository.interface';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import * as schema from '../entities';

export class TeamsRepository implements ITeamsRepository {
    private logger = new Logger(TeamsRepository.name);

    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public addMember = async (dto: schema.NewTeamMember) => {
        this.logger.log(dto);
        return null;
    };

    public create = async (ownerId: string, dto: schema.NewTeam) => {
        this.logger.log(ownerId, dto);
        return null;
    };

    public findAll = async (
        userId: string,
        pagination: { search?: string; limit?: number; offset?: number },
    ) => {
        this.logger.log(userId, pagination);
        return [];
    };

    public findAllTags = async (search?: string) => {
        this.logger.log(search);
        return [];
    };

    public findBySlug = async (slug: string) => {
        this.logger.log(slug);
        return null;
    };

    public remove = async (id: string) => {
        this.logger.log(id);
        return Promise.resolve(true);
    };

    public removeMember = async (teamId: string, userId: string) => {
        this.logger.log(teamId, userId);
        return Promise.resolve(true);
    };

    public syncTags = async (teamId: string, tags: string[]) => {
        this.logger.log(teamId, tags);
        return Promise.resolve(true);
    };

    public update = async (id: string, dto: Partial<schema.Team>) => {
        this.logger.log(id, dto);
        return Promise.resolve(true);
    };

    public updateMember = async (
        teamId: string,
        userId: string,
        dto: Partial<schema.TeamMember>,
    ) => {
        this.logger.log(teamId, userId, dto);
        return Promise.resolve(true);
    };
}
