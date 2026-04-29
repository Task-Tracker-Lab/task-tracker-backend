export class TeamInvitationEvent {
    constructor(
        public email: string,
        public teamName: string,
        public inviteUrl: string,
    ) {}
}
