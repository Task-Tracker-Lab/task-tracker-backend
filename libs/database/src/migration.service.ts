import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { DATABASE_OPTIONS, DATABASE_SERVICE } from './database.constants';
import type { DatabaseService, DatabaseModuleOptions } from './interfaces';
import * as path from 'path';

@Injectable()
export class MigrationService implements OnModuleInit {
    private readonly logger = new Logger(MigrationService.name);

    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<Record<string, unknown>>,
        @Inject(DATABASE_OPTIONS)
        private readonly options: DatabaseModuleOptions,
    ) {}

    async onModuleInit() {
        if (this.options.runMigrations === false) {
            return;
        }

        this.logger.debug('Checking for database migrations...');
        try {
            await migrate(this.db, {
                migrationsFolder: path.resolve(process.cwd(), 'migrations'),
            });
            this.logger.debug('Migrations completed or already up to date');
        } catch (error) {
            this.logger.error('Migration failed', error);
            process.exit(1);
        }
    }
}
