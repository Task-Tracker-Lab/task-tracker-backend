import { Module } from '@nestjs/common';
import { MediaModule } from '@core/modules/media';
import { UserRepository } from './infrastructure/persistence/repositories';
import { UserController, UserSettingsController } from './application/controller';
import { UserFacade } from './application/user.facade';
import {
    FindProfileQuery,
    FindUserQuery,
    GetActivityQuery,
    RegisterUserUseCase,
    UpdateNotificationsUseCase,
    UpdatePasswordUseCase,
    UpdateProfileUseCase,
    UploadAvatarUseCase,
} from './application/use-cases';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

const USE_CASES = [
    UploadAvatarUseCase,
    UpdateProfileUseCase,
    UpdateNotificationsUseCase,
    FindProfileQuery,
    GetActivityQuery,
];

const EXTERNAL_USE_CASES = [RegisterUserUseCase, UpdatePasswordUseCase, FindUserQuery];

@Module({
    imports: [MediaModule],
    controllers: [UserController, UserSettingsController],
    providers: [...USE_CASES, ...EXTERNAL_USE_CASES, REPOSITORY, UserFacade],
    exports: [...EXTERNAL_USE_CASES],
})
export class UserModule {}
