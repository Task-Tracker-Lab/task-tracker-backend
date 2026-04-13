import type { Team, NewTeam, NewTeamMember, TeamMember, Tag } from '../entities';

export interface ITeamsRepository {
    create(ownerId: string, dto: NewTeam): Promise<Team>;
    update(id: string, dto: any): Promise<boolean>;
    remove(id: string): Promise<boolean>;

    findBySlug(slug: string): Promise<Team | null>;
    findAll(
        userId: string,
        // TODO: ADD ZOD QUERY
        pagination: { search?: string; limit?: number; offset?: number },
    ): Promise<Team[]>;

    findAllTags(search?: string): Promise<Tag[]>;
    syncTags(teamId: string, tagNames: string[]): Promise<boolean>;

    addMember(dto: NewTeamMember): Promise<TeamMember>;
    updateMember(teamId: string, userId: string, dto: Partial<TeamMember>): Promise<boolean>;
    removeMember(teamId: string, userId: string): Promise<boolean>;
}
