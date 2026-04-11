import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';
import { CreateUserCommand, FindOneUserCommand } from './commands';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

const COMMANDS = [CreateUserCommand, FindOneUserCommand];

@Module({
    imports: [],
    controllers: [UserController],
    providers: [...COMMANDS, REPOSITORY, UserService],
    exports: [...COMMANDS],
})
export class UserModule {}
