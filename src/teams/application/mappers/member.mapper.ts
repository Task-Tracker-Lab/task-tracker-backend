import type { RawMemberRow, RawMemberTeams } from '../../domain/repository';

export class TeamMemberMapper {
    public static toDetail(row: RawMemberRow) {
        const { firstName, lastName, middleName, avatarUrl, userId, ...rest } = row;

        const fullName =
            [lastName, firstName, middleName].filter(Boolean).join(' ') || 'Unknown User';

        return {
            id: userId,
            ...rest,
            firstName,
            lastName,
            middleName,
            fullName,
            avatarUrl,
            initials: this.getInitials(firstName, lastName),
        };
    }

    public static toList(rows: RawMemberRow[]) {
        return rows.map((row) => this.toDetail(row));
    }

    public static toUserTeam(row: RawMemberTeams) {
        const role = row.role;

        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            avatarUrl: row.avatarUrl,
            role: role,
            joinedAt: row.joinedAt,
            permissions: {
                canEdit: ['owner', 'admin'].includes(role),
                canDelete: role === 'owner',
                canManageMembers: ['owner', 'admin'].includes(role),
                canInvite: ['owner', 'admin'].includes(role),
                isOwner: role === 'owner',
            },
        };
    }

    public static toPublicInvite(raw: string | null, code: string) {
        if (!raw) return null;
        try {
            const p = JSON.parse(raw);
            return {
                code,
                teamName: p.teamName,
                teamAvatar: p.teamAvatar ?? null,
                inviterName: p.inviterName,
                role: p.role,
                expiresAt: p.expiresAt,
            };
        } catch {
            return null;
        }
    }

    private static getInitials(fName: string | null, lName: string | null): string {
        const first = fName?.[0] ?? '';
        const last = lName?.[0] ?? '';
        return (first + last).toUpperCase() || '?';
    }
}
