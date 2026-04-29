import { Injectable } from '@nestjs/common';
import * as UC from './use-cases';
import type {
    CreateTeamDto,
    InviteMemberDto,
    UpdateInvitationDto,
    UpdateMemberDto,
    UpdateTeamDto,
} from './dtos';
import { FileUploadDto } from '@core/modules/media';

@Injectable()
export class TeamsFacade {
    constructor(
        private readonly findTeamQ: UC.FindTeamQuery,
        private readonly getInvitationQ: UC.GetInvitationQuery,
        private readonly getInvitationsQ: UC.GetInvitationsQuery,
        private readonly getTeamMembersQ: UC.GetTeamMembersQuery,
        private readonly checkSlugQ: UC.CheckTeamSlugQuery,

        private readonly createTeamUc: UC.CreateTeamUseCase,
        private readonly deleteTeamUc: UC.DeleteTeamUseCase,
        private readonly updateTeamUc: UC.UpdateTeamUseCase,
        private readonly syncTagsUc: UC.SyncTeamTagsUseCase,
        private readonly updateAvatarUc: UC.UpdateTeamAvatarUseCase,
        private readonly updateBannerUc: UC.UpdateTeamBannerUseCase,

        private readonly updateMemberUc: UC.UpdateTeamMemberUseCase,
        private readonly removeMemberUc: UC.RemoveTeamMemberUseCase,
        private readonly sendInviteUc: UC.SendInvitationUseCase,
        private readonly acceptInviteUc: UC.AcceptInvitationUseCase,
        private readonly updateInvitationUc: UC.UpdateInvitationUseCase,
        private readonly declineInvitationUc: UC.DeclineInvitationUseCase,

        private readonly getMyTeamsUc: UC.GetMyTeamsUseCase,
        private readonly getMyInvitesUc: UC.GetMyInvitesUseCase,
    ) {}

    public checkSlug = (slug: string) => this.checkSlugQ.execute(slug);

    public getTeamBySlug = (slug: string) => this.findTeamQ.execute(slug);

    public getInvitation = (slug: string, code: string, userId: string) =>
        this.getInvitationQ.execute(slug, code, userId);

    public createTeam = (ownerId: string, dto: CreateTeamDto) =>
        this.createTeamUc.execute(ownerId, dto);

    public updateTeam = (slug: string, userId: string, dto: UpdateTeamDto) =>
        this.updateTeamUc.execute(slug, userId, dto);

    public deleteTeam = (slug: string, userId: string) => this.deleteTeamUc.execute(slug, userId);

    public getMembers = (slug: string) => this.getTeamMembersQ.execute(slug);

    public updateMember = (slug: string, curr: string, target: string, dto: UpdateMemberDto) =>
        this.updateMemberUc.execute(slug, curr, target, dto);

    public removeMember = (slug: string, curr: string, target: string) =>
        this.removeMemberUc.execute(slug, curr, target);

    public getInvitations = (slug: string, userId?: string) =>
        this.getInvitationsQ.execute(slug, userId);

    public invite = (slug: string, inviterId: string, dto: InviteMemberDto) =>
        this.sendInviteUc.execute(slug, inviterId, dto);

    public acceptInvite = (code: string, userId: string, email: string) =>
        this.acceptInviteUc.execute(code, userId, email);

    public declineInvitation = (slug: string, code: string, userId: string) =>
        this.declineInvitationUc.execute(slug, code, userId);

    public updateInvitation = (
        slug: string,
        code: string,
        userId: string,
        dto: UpdateInvitationDto,
    ) => this.updateInvitationUc.execute(slug, code, userId, dto);

    public updateAvatar = (slug: string, file: FileUploadDto) =>
        this.updateAvatarUc.execute(slug, file);

    public updateBanner = (slug: string, file: FileUploadDto) =>
        this.updateBannerUc.execute(slug, file);

    public syncTags = (slug: string, tags: string[]) => this.syncTagsUc.execute(slug, tags);

    public getMyTeams = (userId: string, pagination: any) =>
        this.getMyTeamsUc.execute(userId, pagination);

    public getMyInvites = (email: string) => this.getMyInvitesUc.execute(email);
}
