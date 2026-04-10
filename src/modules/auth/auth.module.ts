import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user';

@Module({
    imports: [forwardRef(() => UserModule)],
    controllers: [],
    providers: [],
    exports: [],
})
export class AuthModule {}
