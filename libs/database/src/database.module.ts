import {
    type DynamicModule,
    Logger,
    Module,
    OnApplicationShutdown,
    type Provider,
    type Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_OPTIONS, DATABASE_SERVICE } from './database.constants';
import type {
    DatabaseModuleAsyncOptions,
    DatabaseModuleOptions,
    DatabaseModuleOptionsFactory,
} from './interfaces';

@Module({
    providers: [],
})
export class DatabaseModule implements OnApplicationShutdown {
    private static logger = new Logger(DatabaseModule.name);

    private static pool: Pool;

    static register(config: DatabaseModuleOptions): DynamicModule {
        return {
            module: DatabaseModule,
            global: config.global ?? false,
            providers: [this.createOptionsProvider(config), this.createDatabaseProvider()],
            exports: [DATABASE_SERVICE],
        };
    }

    static registerAsync(config: DatabaseModuleAsyncOptions): DynamicModule {
        return {
            module: DatabaseModule,
            global: config.global ?? false,
            imports: config.imports ?? [],
            providers: [...this.createAsyncProviders(config), this.createDatabaseProvider()],
            exports: [DATABASE_SERVICE],
        };
    }

    private static createOptionsProvider(options: DatabaseModuleOptions): Provider {
        return {
            provide: DATABASE_OPTIONS,
            useValue: options,
        };
    }

    private static createDatabaseProvider(): Provider {
        return {
            provide: DATABASE_SERVICE,
            useFactory: async (cfg: ConfigService, opts: DatabaseModuleOptions) => {
                const baseUrl = cfg.get<string>('DATABASE_URL');

                const pool = new Pool({
                    connectionString: baseUrl,
                    max: 20,
                    idleTimeoutMillis: 30000,
                });

                pool.on('connect', (client) => {
                    client.query(`SET search_path TO ${opts.schemaName || 'public'}`);
                });

                this.pool = pool;

                return drizzle(pool, {
                    schema: opts.schema,
                    logger: opts.logging
                        ? {
                              logQuery(query, params) {
                                  const start = Date.now();
                                  DatabaseModule.logger.debug(`SQL: ${query}`);

                                  if (params?.length) {
                                      DatabaseModule.logger.debug(
                                          `Params: ${JSON.stringify(params)}`,
                                      );
                                  }

                                  const duration = Date.now() - start;
                                  DatabaseModule.logger.debug(`Execution time: ${duration}ms`);
                              },
                          }
                        : false,
                });
            },
            inject: [ConfigService, DATABASE_OPTIONS],
        };
    }

    private static createAsyncProviders(options: DatabaseModuleAsyncOptions): Provider[] {
        if (options.useFactory) {
            return [
                {
                    provide: DATABASE_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                ...(options.extraProviders || []),
            ];
        }

        const providers: Provider[] = [];

        const useClass = options.useClass || options.useExisting;
        if (!useClass) {
            throw new Error(
                'You must provide either useClass, useExisting or useFactory in DatabaseModuleAsyncOptions',
            );
        }

        providers.push(this.createAsyncOptionsProvider(useClass));

        if (options.useClass) {
            providers.push({ provide: useClass, useClass });
        }

        if (options.extraProviders) {
            providers.push(...options.extraProviders);
        }

        return providers;
    }

    private static createAsyncOptionsProvider(
        useClass: Type<DatabaseModuleOptionsFactory>,
    ): Provider {
        return {
            provide: DATABASE_OPTIONS,
            useFactory: async (optionsFactory: DatabaseModuleOptionsFactory) =>
                optionsFactory.createDatabaseOptions(),
            inject: [useClass],
        };
    }

    async onApplicationShutdown(_signal?: string) {
        if (DatabaseModule.pool) {
            DatabaseModule.logger.log('Closing database connections...');
            await DatabaseModule.pool.end();
        }
    }
}
