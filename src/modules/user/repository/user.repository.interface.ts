import {
    NewUser,
    NewUserActivity,
    User,
    UserActivity,
    UserNotifications,
    UserProfile,
} from '../entities/user.domain';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;

    existsByEmail(email: string): Promise<boolean>;

    updateProfile(id: string, data: Partial<User>): Promise<User>;
    updateNotifications(id: string, settings: UserNotifications['settings']): Promise<void>;
    updateAvatar(id: string, url: string): Promise<void>;

    create(data: NewUser): Promise<User>;

    logActivity(data: NewUserActivity): Promise<void>;
    findActivityByUser(
        userId: string,
        options: { limit: number; offset: number },
    ): Promise<{
        items: UserActivity[];
        total: number;
    }>;

    findProfile(id: string): Promise<UserProfile>;

    updatePasswordHash(id: string, hash: string): Promise<void>;
}
