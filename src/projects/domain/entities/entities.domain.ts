import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { projects, projectShares } from '../../infrastructure/persistence/models/projects.model';

export enum ProjectStatus {
    Active = 'active',
    Archived = 'archived',
    Template = 'template',
}

export enum ProjectVisibility {
    Public = 'public',
    Private = 'private',
}

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;
export interface ProjectSettings {
    allowGuestComments?: boolean;
    defaultAssigneeId?: string;
    showTaskNumbers?: boolean;
}

export type ProjectWithTypedSettings = Omit<Project, 'settings'> & {
    settings: ProjectSettings;
};

export type ProjectShare = InferSelectModel<typeof projectShares>;
export type NewProjectShare = InferInsertModel<typeof projectShares>;
