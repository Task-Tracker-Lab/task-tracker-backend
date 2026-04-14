import type { Team, NewTeam, NewTeamMember, TeamMember, Tag } from '../entities';

type TResponse = { success: boolean; tags: number; teamId: string };

export interface ITeamsRepository {
    create(ownerId: string, dto: NewTeam, tags?: string[]): Promise<TResponse>;
    update(id: string, dto: Partial<NewTeam>, tags?: string[]): Promise<TResponse>;
    remove(id: string, userId: string): Promise<boolean>;
    findMember(teamId: string, userId: string): Promise<TeamMember | null>;
    // TODO: FIX THAT TYPE
    findMembers(teamId: string): Promise<any[]>;
    findBySlug(slug: string): Promise<Team | null>;
    findByUser(
        userId: string,
        // TODO: ADD ZOD QUERY
        pagination: { search?: string; limit?: number; offset?: number },
    ): Promise<any[]>;

    findAllTags(options: {
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ data: Tag[]; total: number }>;
    syncTags(teamId: string, tagNames: string[]): Promise<boolean>;

    updateTeamAvatar(teamId: string, url: string): Promise<boolean>;
    updateTeamBanner(teamId: string, url: string): Promise<boolean>;

    addMember(dto: NewTeamMember): Promise<boolean>;
    updateMember(teamId: string, userId: string, dto: Partial<TeamMember>): Promise<boolean>;
    removeMember(teamId: string, userId: string): Promise<boolean>;
}
