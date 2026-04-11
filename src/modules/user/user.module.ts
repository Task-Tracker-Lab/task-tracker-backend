import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';
import { CreateUserCommand, FindOneUserCommand, UpdatePassUserCommand } from './commands';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

const COMMANDS = [CreateUserCommand, FindOneUserCommand, UpdatePassUserCommand];

@Module({
    imports: [],
    controllers: [UserController],
    providers: [...COMMANDS, REPOSITORY, UserService],
    exports: [...COMMANDS],
})
export class UserModule {}
