import { Module } from '@nestjs/common';
import { UserController } from './controller';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';

const REPOSITORY = {
    provide: 'IUserRepository',
    useClass: UserRepository,
};

@Module({
    imports: [],
    controllers: [UserController],
    providers: [REPOSITORY, UserService],
    exports: [UserService],
})
export class UserModule {}
