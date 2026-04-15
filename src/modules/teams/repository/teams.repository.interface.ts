import type { Team, NewTeam, NewTeamMember, Tag } from '../entities';

type TResponse = { success: boolean; tags: number; teamId: string };

export type RawMemberRow = {
    userId: string;
    role: string;
    status: string;
    joinedAt: Date | string | null;
    firstName: string | null;
    lastName: string | null;
    middleName: string | null;
    avatarUrl: string | null;
    email?: string;
};

export type RawMemberTeams = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatarUrl: string | null;
    role: string;
    joinedAt: Date;
};

export interface ITeamsRepository {
    create(ownerId: string, dto: NewTeam, tags?: string[]): Promise<TResponse>;
    update(id: string, dto: Partial<NewTeam>, tags?: string[]): Promise<TResponse>;
    remove(id: string, userId: string): Promise<boolean>;

    isSlugAvailable(slug: string): Promise<boolean>;

    findMember(teamId: string, userId: string): Promise<RawMemberRow | null>;
    findMembers(teamId: string): Promise<RawMemberRow[]>;
    findBySlug(slug: string): Promise<Team | null>;
    findByUser(
        userId: string,
        // TODO: ADD ZOD QUERY
        pagination: { search?: string; limit?: number; offset?: number },
    ): Promise<RawMemberTeams[]>;

    findAllTags(options: {
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ data: Tag[]; total: number }>;
    syncTags(teamId: string, tagNames: string[]): Promise<boolean>;

    updateTeamAvatar(teamId: string, url: string): Promise<boolean>;
    updateTeamBanner(teamId: string, url: string): Promise<boolean>;

    addMember(dto: NewTeamMember): Promise<boolean>;
    updateMember(
        teamId: string,
        userId: string,
        dto: { role?: string; status?: string },
    ): Promise<boolean>;
    removeMember(teamId: string, userId: string): Promise<boolean>;
}
