import { baseSchema } from 'src/shared/entities';

export const projectStatusEnum = baseSchema.enum('project_status', [
    'active',
    'archived',
    'template',
]);
export const projectVisibilityEnum = baseSchema.enum('project_visibility', ['public', 'private']);
