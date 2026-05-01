import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
    users,
    userSecurity,
    userNotifications,
    userActivity,
} from '../../infrastructure/persistence/models/user.entity';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type UserSecurity = InferSelectModel<typeof userSecurity>;
export type NewUserSecurity = InferInsertModel<typeof userSecurity>;

export type UserNotifications = InferSelectModel<typeof userNotifications>;
export type NotificationSettings = Pick<UserNotifications, 'settings'>;

export type UserActivity = InferSelectModel<typeof userActivity>;
export type NewUserActivity = InferInsertModel<typeof userActivity>;

export type UserProfile = {
    user: User;
    security: Pick<UserSecurity, 'lastPasswordChange' | 'is2faEnabled'>;
    notifications: NotificationSettings['settings'];
};

export type UserWithSecurity = {
    user: User;
    security: Pick<UserSecurity, 'passwordHash'>;
};
