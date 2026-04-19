import type { NewProject, NewProjectShare, Project } from '../entities';

export interface IProjectsRepository {
    create(data: NewProject): Promise<{ result: boolean; id: string }>;
    update(id: string, data: Partial<NewProject>): Promise<boolean>;
    delete(id: string): Promise<boolean>;
    findOne(id: string): Promise<Project | null>;
    findByTeam(teamId: string): Promise<Project[]>;
    createShare(data: NewProjectShare): Promise<boolean>;
    hasValidShareToken(id: string, token: string): Promise<boolean>;
    revokeAllShares(projectId: string): Promise<boolean>;
}
