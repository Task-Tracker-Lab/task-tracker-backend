export const MAX_AREAS_PER_PROJECT = 50;
export const MAX_STATES_PER_PROJECT = 20;

export const DEFAULT_STATES = [
    { title: 'Бэклог', type: 'backlog', category: 'backlog', position: 0, color: '#94A3B8' },
    { title: 'К выполнению', type: 'todo', category: 'active', position: 1, color: '#3B82F6' },
    { title: 'В работе', type: 'in_progress', category: 'active', position: 2, color: '#F59E0B' },
    { title: 'На ревью', type: 'review', category: 'review', position: 3, color: '#8B5CF6' },
    { title: 'Готово', type: 'done', category: 'completed', position: 4, color: '#10B981' },
    { title: 'Архив', type: 'archived', category: 'archived', position: 5, color: '#6B7280' },
] as const;

export const REORDER_TRIGGER = 0.00001;
