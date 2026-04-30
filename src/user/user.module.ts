import { Module } from '@nestjs/common';
import { MediaModule } from '@shared/media';
import { UserRepository } from './infrastructure/persistence/repositories';
import { UserController, UserSettingsController } from './application/controller';
import { UserFacade } from './application/user.facade';
import { USER_EXTERNAL_USE_CASES, UserQueries, UserUseCases } from './application/use-cases';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

@Module({
    imports: [MediaModule],
    controllers: [UserController, UserSettingsController],
    providers: [...UserUseCases, ...UserQueries, REPOSITORY, UserFacade],
    exports: [...USER_EXTERNAL_USE_CASES],
})
export class UserModule {}
