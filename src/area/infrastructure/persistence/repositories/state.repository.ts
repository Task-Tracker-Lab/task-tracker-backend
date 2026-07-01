import { IStateRepository } from '@core/area/domain/repository';
import { DATABASE_SERVICE, DatabaseService } from '@libs/database';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, isNotNull, isNull, sql } from 'drizzle-orm';

import * as schema from '../models';

import type { NewState } from '@core/area/domain/entities';

@Injectable()
export class StateRepository implements IStateRepository {
    constructor(
        @Inject(DATABASE_SERVICE)
        private readonly db: DatabaseService<typeof schema>,
    ) {}

    public async create(data: NewState) {
        const [result] = await this.db
            .insert(schema.states)
            .values(data)
            .returning({ id: schema.states.id });

        if (!result) {
            throw new Error('Failed to create state: no state returned');
        }

        return result;
    }

    public async delete(areaId: string, stateId: string) {
        const result = await this.db
            .update(schema.states)
            .set({ deletedAt: new Date().toISOString() })
            .where(
                and(
                    eq(schema.states.id, stateId),
                    eq(schema.states.areaId, areaId),
                    isNull(schema.states.deletedAt),
                ),
            );

        return (result.count ?? 0) > 0;
    }

    public async find(areaId: string, _query: unknown) {
        return this.db
            .select()
            .from(schema.states)
            .where(and(eq(schema.states.areaId, areaId), isNull(schema.states.deletedAt)));
    }

    public async findOne(areaId: string, stateId: string, deleted?: boolean) {
        const [result] = await this.db
            .select()
            .from(schema.states)
            .where(
                and(
                    eq(schema.states.id, stateId),
                    eq(schema.states.areaId, areaId),
                    deleted ? isNotNull(schema.states.deletedAt) : isNull(schema.states.deletedAt),
                ),
            );

        return result ?? null;
    }

    public async update(areaId: string, stateId: string, data: Partial<NewState>) {
        const result = await this.db
            .update(schema.states)
            .set(data)
            .where(
                and(
                    eq(schema.states.id, stateId),
                    eq(schema.states.areaId, areaId),
                    isNull(schema.states.deletedAt),
                ),
            );

        return (result.count ?? 0) > 0;
    }

    public async findByType(
        areaId: string,
        // TODO: ADD BASE ENUM TOO
        stateType: 'custom' | 'archived' | 'backlog' | 'todo' | 'in_progress' | 'review' | 'done',
    ) {
        const [result] = await this.db
            .select()
            .from(schema.states)
            .where(
                and(
                    eq(schema.states.areaId, areaId),
                    eq(schema.states.stateType, stateType),
                    isNull(schema.states.deletedAt),
                ),
            );

        return result ?? null;
    }

    public async findByTitle(areaId: string, title: string) {
        const [result] = await this.db
            .select()
            .from(schema.states)
            .where(
                and(
                    eq(schema.states.areaId, areaId),
                    eq(schema.states.title, title),
                    isNull(schema.states.deletedAt),
                ),
            );

        return result ?? null;
    }

    public async reorder(areaId: string) {
        const currentStates = await this.db
            .select({ id: schema.states.id })
            .from(schema.states)
            .where(eq(schema.states.areaId, areaId))
            .orderBy(schema.states.position);

        if (currentStates.length === 0) {
            return;
        }

        const STEP = 100.0;
        const sqlChunks: string[] = [];

        currentStates.forEach((state, index) => {
            const newPos = (index + 1) * STEP;
            sqlChunks.push(`WHEN id = '${state.id}' THEN ${newPos}::double precision`);
        });

        await this.db.execute(sql`
          UPDATE ${schema.states}
          SET position = CASE ${sql.raw(sqlChunks.join(' '))} END
          WHERE area_id = ${areaId}
        `);
    }

    public readonly countByArea = async (areaId: string) => {
        const [result] = await this.db
            .select({ count: count() })
            .from(schema.states)
            .where(and(eq(schema.states.areaId, areaId), isNull(schema.states.deletedAt)));

        return result?.count ?? 0;
    };
}
