import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as path from 'path';
import { ConfigSchema } from './config.schema';
import { ZodError } from 'zod/v4';

const validateConfig = (config: Record<string, unknown>) => {
    try {
        return ConfigSchema.parse(config);
    } catch (error) {
        if (error instanceof ZodError) {
            console.group('\nENVIRONMENT_VALIDATION_ERROR\n');

            error.issues.forEach((issue) => {
                const field = issue.path.join('.') || 'ROOT';

                console.group(`Field: ${field}`);
                console.error(`Message: ${issue.message}`);
                console.error(`Code:    ${issue.code.toUpperCase()}`);
                console.groupEnd();
                console.error('\n');
            });

            console.groupEnd();

            throw new Error('Invalid environment configuration');
        }
        throw error;
    }
};

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            envFilePath: path.resolve(process.cwd(), '.env'),
            validate: validateConfig,
            validationOptions: {
                abortEarly: true,
            },
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigModule {}
