export const KEYS = {
    INVITE: (code: string) => `inv:code:${code}`,
    TEAM_INVITES: (teamId: string) => `team:invites:${teamId}`,
    USER_INVITES: (email: string) => `user:invites:${email.toLowerCase()}`,
};
