import { Injectable } from '@nestjs/common';
import { ROLE_PRIORITY } from '@shared/constants';
import type { TeamRole } from '@shared/entities';

@Injectable()
export class TeamMemberPolicy {
    constructor() {}

    private getPriority(role: TeamRole): number {
        return ROLE_PRIORITY[role] ?? 0;
    }

    /**
     * Может ли Инициатор вообще редактировать Цель?
     */
    public canManage(issuerRole: TeamRole, targetRole: TeamRole): boolean {
        // Минимальный порог для управления — администратор
        if (this.getPriority(issuerRole) < ROLE_PRIORITY.admin) return false;

        // Нельзя редактировать того, кто равен или выше по рангу
        return this.getPriority(issuerRole) > this.getPriority(targetRole);
    }

    /**
     * Может ли Инициатор назначить Цели новую роль?
     */
    public canAssignRole(
        issuerRole: TeamRole,
        targetCurrentRole: TeamRole,
        newRole: TeamRole,
    ): boolean {
        // 1. Проверка прав на управление целью
        if (!this.canManage(issuerRole, targetCurrentRole)) return false;

        // 2. Роль Owner неприкосновенна (нельзя снять и нельзя назначить через обычный Update)
        if (targetCurrentRole === 'owner' || newRole === 'owner') return false;

        // 3. Нельзя назначить роль выше своей или равную своей (если ты не владелец)
        if (issuerRole !== 'owner' && this.getPriority(newRole) >= this.getPriority(issuerRole)) {
            return false;
        }

        return true;
    }

    /**
     * Может ли Инициатор менять статус (ban/block/active) Цели?
     */
    public canChangeStatus(issuerRole: TeamRole, targetRole: TeamRole): boolean {
        // Владельца нельзя забанить или деактивировать
        if (targetRole === 'owner') return false;

        // В остальном работают стандартные правила иерархии
        return this.canManage(issuerRole, targetRole);
    }

    /**
     * Может ли Инициатор удалить Цель (или самого себя)?
     */
    canRemove(issuerRole: TeamRole, targetRole: TeamRole, isSelf: boolean): boolean {
        if (isSelf) {
            return issuerRole !== 'owner';
        }

        const issuerPrio = this.getPriority(issuerRole);
        const targetPrio = this.getPriority(targetRole);

        return issuerPrio >= ROLE_PRIORITY.admin && issuerPrio > targetPrio;
    }
}
