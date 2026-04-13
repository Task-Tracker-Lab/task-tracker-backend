import { baseSchema } from 'src/shared/entities';

export const roleEnum = baseSchema.enum('team_role', ['admin', 'moderator', 'member']);
export const statusEnum = baseSchema.enum('member_status', [
    'pending',
    'active',
    'declined',
    'banned',
]);
