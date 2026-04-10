import type { FactoryProvider, ModuleMetadata, Provider, Type } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface DatabaseModuleOptions {
    schemaName: string;
    schema: Record<string, unknown>;
    logging?: boolean;
    global?: boolean;
}

export interface DatabaseModuleOptionsFactory {
    createDatabaseOptions(): Promise<DatabaseModuleOptions> | DatabaseModuleOptions;
}

export interface DatabaseModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    useExisting?: Type<DatabaseModuleOptionsFactory>;
    useClass?: Type<DatabaseModuleOptionsFactory>;
    useFactory?: (
        ...args: unknown[]
    ) => Promise<Omit<DatabaseModuleOptions, 'global'>> | Omit<DatabaseModuleOptions, 'global'>;
    inject?: FactoryProvider['inject'];
    global?: boolean;
    extraProviders?: Provider[];
}

export type DatabaseService<T extends Record<string, unknown>> = NodePgDatabase<T>;
