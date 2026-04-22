import type { RawMemberRow } from '@core/modules/teams/repository';
import type { Project } from '@shared/entities';
import { ROLE_PRIORITY } from '@shared/constants';

export class ProjectsMapper {
    public static toDetailResponse(project: Project, member?: RawMemberRow, token?: string) {
        const {
            id,
            key,
            name,
            status,
            description,
            color,
            icon,
            taskSequence,
            createdAt,
            updatedAt,
            visibility,
            settings,
        } = project;

        const rolePriority = member ? ROLE_PRIORITY[member.role] : -1;

        return {
            id,
            key,
            name,
            status,
            description,
            visuals: {
                color: color ?? '#3b82f6',
                icon,
            },
            meta: {
                taskSequence,
                createdAt,
                updatedAt,
            },
            access: {
                visibility,
                canEdit: rolePriority >= ROLE_PRIORITY.moderator,
                canDelete: rolePriority >= ROLE_PRIORITY.admin,
                shareUrl: visibility === 'public' && token ? `/share/${token}` : null,
            },
            settings: settings || {},
        };
    }

    public static toListResponse(project: Project, member: RawMemberRow) {
        const { id, key, name, status, color, icon, createdAt } = project;

        return {
            id,
            key,
            name,
            status,
            color: color ?? '#3b82f6',
            icon,
            createdAt,
            canEdit: ROLE_PRIORITY[member.role] >= ROLE_PRIORITY.moderator,
        };
    }
}
