import { baseSchema } from 'src/shared/entities';

export const roleEnum = baseSchema.enum('team_role', [
    'owner',
    'admin', // управление юзерами, настройками
    'lead', // управление проектами
    'moderator', // чистка контента/сообщений
    'member', // обычный работяга
    'viewer', // просто смотрит
]);
export const statusEnum = baseSchema.enum('member_status', [
    'active', // Полноценный участник
    'banned', // Заблокирован не может вернуться по инвайту
    'inactive', // Доступ закрыт, но запись сохранена
]);
