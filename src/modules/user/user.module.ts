import { Module } from '@nestjs/common';
import { UserController, UserSettingsController } from './controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repository/user.repository';
import { CreateUserCommand, FindOneUserCommand, UpdatePassUserCommand } from './commands';
import { MediaModule } from '../media/media.module';
import { UserSettingsService } from './services';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

const COMMANDS = [CreateUserCommand, FindOneUserCommand, UpdatePassUserCommand];

@Module({
    imports: [MediaModule],
    controllers: [UserController, UserSettingsController],
    providers: [...COMMANDS, REPOSITORY, UserService, UserSettingsService],
    exports: [...COMMANDS],
})
export class UserModule {}
