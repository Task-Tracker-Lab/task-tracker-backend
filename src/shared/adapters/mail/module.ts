import { Global, Module } from '@nestjs/common';
import { MailAdapter } from './adapter';

@Global()
@Module({
    providers: [
        {
            provide: 'IMailPort',
            useClass: MailAdapter,
        },
    ],
    exports: ['IMailPort'],
})
export class MailModule {}
