import { Module } from '@nestjs/common';
import { UserModule } from '../user';
import { AuthController } from './controller';
import { AuthService } from './auth.service';

@Module({
    imports: [UserModule],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [],
})
export class AuthModule {}
