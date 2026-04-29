import type {
    NewUser,
    NewUserActivity,
    User,
    UserActivity,
    UserNotifications,
    UserProfile,
    UserWithSecurity,
} from '../entities/user.domain';

export interface IUserRepository {
    create(data: NewUser): Promise<User>;
    findById(id: string): Promise<UserWithSecurity | null>;
    findByEmail(email: string): Promise<UserWithSecurity | null>;
    findProfile(id: string): Promise<UserProfile>;
    findActivityByUser(
        userId: string,
        options: { limit: number; offset: number },
    ): Promise<{
        items: UserActivity[];
        total: number;
    }>;
    updateAvatar(id: string, url: string): Promise<boolean>;
    updateProfile(id: string, data: Partial<User>): Promise<boolean>;
    updatePasswordHash(id: string, hash: string): Promise<boolean>;
    updateNotifications(id: string, settings: UserNotifications['settings']): Promise<boolean>;
    logActivity(data: NewUserActivity): Promise<boolean>;
}
