import { CheckTeamSlugQuery } from './base/check-team-slug.query';
import { FindTeamQuery } from './base/find-team.query';
import { FindTeamMemberQuery } from './members/find-team-member.query';
import { GetInvitationQuery } from './invitions/get-invitation.query';
import { GetInvitationsQuery } from './invitions/get-invitations.query';
import { GetTeamMembersQuery } from './members/get-team-members.query';
import { GetAllTagsUseCase } from './base/get-all-tags.use-case';
import { GetMyInvitesUseCase } from './invitions/get-my-invites.use-case';
import { GetMyTeamsUseCase } from './base/get-my-teams.use-case';

import { AcceptInvitationUseCase } from './invitions/accept-invitation.use-case';
import { CreateTeamUseCase } from './base/create-team.use-case';
import { DeleteTeamUseCase } from './base/delete-team.use-case';
import { RemoveTeamMemberUseCase } from './members/remove-team-member.use-case';
import { SendInvitationUseCase } from './invitions/send-invitation.use-case';
import { SyncTeamTagsUseCase } from './base/sync-team-tags.use-case';
import { UpdateTeamUseCase } from './base/update-team.use-case';
import { UpdateTeamAvatarUseCase } from './base/update-team-avatar.use-case';
import { UpdateTeamBannerUseCase } from './base/update-team-banner.use-case';
import { UpdateTeamMemberUseCase } from './members/update-team-member.use-case';
import { UpdateInvitationUseCase } from './invitions/update-invitation.use-case';
import { DeclineInvitationUseCase } from './invitions/decline-invitation.use-case';

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
