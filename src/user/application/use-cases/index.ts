import { RegisterUserUseCase } from './register-user.use-case';
import { UpdateNotificationsUseCase } from './update-notifications.use-case';
import { UpdatePasswordUseCase } from './update-password.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';
import { UploadAvatarUseCase } from './upload-avatar.use-case';

import { FindProfileQuery } from './find-profile.query';
import { FindUserQuery } from './find-user.query';
import { GetActivityQuery } from './get-activity.query';

export * from './register-user.use-case';
export * from './update-notifications.use-case';
export * from './update-password.use-case';
export * from './update-profile.use-case';
export * from './upload-avatar.use-case';

export * from './find-profile.query';
export * from './find-user.query';
export * from './get-activity.query';

export const UserUseCases = [
    RegisterUserUseCase,
    UpdateNotificationsUseCase,
    UpdatePasswordUseCase,
    UpdateProfileUseCase,
    UploadAvatarUseCase,
];

export const UserQueries = [FindProfileQuery, FindUserQuery, GetActivityQuery];

export const USER_EXTERNAL_USE_CASES = [RegisterUserUseCase, UpdatePasswordUseCase, FindUserQuery];
