import { CheckTeamSlugQuery } from './check-team-slug.query';
import { FindTeamQuery } from './find-team.query';
import { FindTeamMemberQuery } from './find-team-member.query';
import { GetInvitationQuery } from './get-invitation.query';
import { GetInvitationsQuery } from './get-invitations.query';
import { GetTeamMembersQuery } from './get-team-members.query';
import { GetAllTagsUseCase } from './get-all-tags.use-case';
import { GetMyInvitesUseCase } from './get-my-invites.use-case';
import { GetMyTeamsUseCase } from './get-my-teams.use-case';
import { GetUserInvitesUseCase } from './get-user-invites.use-case';

import { AcceptInvitationUseCase } from './accept-invitation.use-case';
import { CreateTeamUseCase } from './create-team.use-case';
import { DeleteTeamUseCase } from './delete-team.use-case';
import { RemoveTeamMemberUseCase } from './remove-team-member.use-case';
import { SendInvitationUseCase } from './send-invitation.use-case';
import { SyncTeamTagsUseCase } from './sync-team-tags.use-case';
import { UpdateTeamUseCase } from './update-team.use-case';
import { UpdateTeamAvatarUseCase } from './update-team-avatar.use-case';
import { UpdateTeamBannerUseCase } from './update-team-banner.use-case';
import { UpdateTeamMemberUseCase } from './update-team-member.use-case';
import { UpdateInvitationUseCase } from './update-invitation.use-case';
import { DeclineInvitationUseCase } from './decline-invitation.use-case';

export {
    CheckTeamSlugQuery,
    FindTeamQuery,
    FindTeamMemberQuery,
    GetInvitationQuery,
    GetInvitationsQuery,
    GetTeamMembersQuery,
    GetAllTagsUseCase,
    GetMyInvitesUseCase,
    GetMyTeamsUseCase,
    GetUserInvitesUseCase,
    AcceptInvitationUseCase,
    CreateTeamUseCase,
    DeleteTeamUseCase,
    RemoveTeamMemberUseCase,
    SendInvitationUseCase,
    SyncTeamTagsUseCase,
    UpdateTeamUseCase,
    UpdateTeamAvatarUseCase,
    UpdateTeamBannerUseCase,
    UpdateTeamMemberUseCase,
    UpdateInvitationUseCase,
    DeclineInvitationUseCase,
};

export const TeamQueries = [
    CheckTeamSlugQuery,
    FindTeamQuery,
    FindTeamMemberQuery,
    GetInvitationQuery,
    GetInvitationsQuery,
    GetTeamMembersQuery,
    GetAllTagsUseCase,
    GetMyInvitesUseCase,
    GetMyTeamsUseCase,
    GetUserInvitesUseCase,
];

export const TeamUseCases = [
    AcceptInvitationUseCase,
    CreateTeamUseCase,
    DeleteTeamUseCase,
    RemoveTeamMemberUseCase,
    SendInvitationUseCase,
    SyncTeamTagsUseCase,
    UpdateTeamUseCase,
    UpdateTeamAvatarUseCase,
    UpdateTeamBannerUseCase,
    UpdateTeamMemberUseCase,
    UpdateInvitationUseCase,
    DeclineInvitationUseCase,
];

export const TEAM_EXTERNAL_QUERIES = [FindTeamQuery, FindTeamMemberQuery];
