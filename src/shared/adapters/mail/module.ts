import { Global, Module } from '@nestjs/common';
import { MailAdapter } from './adapter';
import { MailProcessor } from '@shared/workers';

@Global()
@Module({
    providers: [
        {
            provide: 'IMailPort',
            useClass: MailAdapter,
        },
        MailProcessor,
    ],
    exports: ['IMailPort'],
})
export class MailModule {}
