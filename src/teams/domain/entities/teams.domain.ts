import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { teams, teamMembers, tags, teamsToTags } from '../../infrastructure/persistence/models';

export type Team = InferSelectModel<typeof teams>;
export type NewTeam = InferInsertModel<typeof teams>;

export type TeamMember = InferSelectModel<typeof teamMembers>;
export type NewTeamMember = InferInsertModel<typeof teamMembers>;

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;

export type TeamToTag = InferSelectModel<typeof teamsToTags>;
export type NewTeamToTag = InferInsertModel<typeof teamsToTags>;

export type TeamWithMembers = Team & {
    members: TeamMember[];
};

export type TeamWithTags = Team & {
    tags: Tag[];
};
