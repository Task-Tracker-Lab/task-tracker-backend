import * as dotenv from 'dotenv';
dotenv.config();

import { createId } from '@paralleldrive/cuid2';
import * as argon from 'argon2';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as sc from '../../../src/shared/entities/index';
import { sql } from 'drizzle-orm';

const DB_URL = process.env.DATABASE_URL;

async function seed(db: NodePgDatabase<typeof sc>) {
    const COUNT = 1000;
    const OUT_USERS_FILE = resolve(process.cwd(), 'infra/k6/data/users.json');
    const OUT_TEAMS_FILE = resolve(process.cwd(), 'infra/k6/data/teams.json');
    const OUT_TAGS_FILE = resolve(process.cwd(), 'infra/k6/data/tags.json');

    console.log(`Start seeding using pg driver...`);

    const password = 'TestPassword123!';
    const passwordHash = await argon.hash(password);

    const usersToInsert = [];
    const securityToInsert = [];
    const notificationsToInsert = [];
    const activitiesToInsert = [];
    const usersData = [];
    const teamsData = [];
    const tagsData = [];
    const teamsToInsert = [];
    const tagsToInsert = [];
    const teamsToTagsToInsert = [];
    const teamMembersToInsert = [];

    for (let i = 0; i < COUNT; i++) {
        const userId = createId();
        const teamId = createId();
        const tagId = createId();
        const email = `k6_user_${i}@tasktracker.com`;

        const user = {
            id: userId,
            email,
            firstName: 'K6',
            lastName: `User ${i}`,
            timezone: 'UTC',
            language: 'ru',
        };
        const team = {
            id: teamId,
            ownerId: userId,
            name: `k6_team_${i}`,
            slug: `k6_team_${i}`,
            description: `description team - ${i}`,
        };
        const tag = {
            id: tagId,
            name: `k6_tag_${i}`,
        };
        const teamMember = {
            teamId: teamId,
            userId: userId,
            role: 'owner',
            status: 'active',
            joinedAt: new Date(),
        };

        usersToInsert.push(user);
        teamsToInsert.push(team);
        tagsToInsert.push(tag);
        teamsToTagsToInsert.push({
            teamId,
            tagId,
        });
        teamMembersToInsert.push(teamMember);
        securityToInsert.push({ userId, passwordHash });
        notificationsToInsert.push({ userId });

        usersData.push({ email, password });
        teamsData.push(team);
        tagsData.push(tag);

        for (let j = 0; j < 10; j++) {
            activitiesToInsert.push({
                id: createId(),
                userId: userId,
                eventType: 'SIGN_IN',
                entityId: userId,
                metadata: {
                    description: `K6 Load Test Iteration ${j}`,
                    ip: '127.0.0.1',
                    userAgent: 'k6-test-agent',
                },
                createdAt: new Date(Date.now() - j * 1000 * 60 * 60),
            });
        }
    }

    await db.transaction(async (tx) => {
        await tx.insert(sc.users).values(usersToInsert);
        await tx.insert(sc.userSecurity).values(securityToInsert);
        await tx.insert(sc.userNotifications).values(notificationsToInsert);

        const chunkSize = 1000;
        for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
            const chunk = activitiesToInsert.slice(i, i + chunkSize);
            await tx.insert(sc.userActivity).values(chunk);
        }
        await tx.insert(sc.teams).values(teamsToInsert);
        await tx.insert(sc.tags).values(tagsToInsert);
        await tx.insert(sc.teamsToTags).values(teamsToTagsToInsert);
        await tx.insert(sc.teamMembers).values(teamMembersToInsert);
    });

    const filesToSave = [
        { path: OUT_USERS_FILE, data: usersData },
        { path: OUT_TEAMS_FILE, data: teamsData },
        { path: OUT_TAGS_FILE, data: tagsData },
    ];

    for (const { path, data } of filesToSave) {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, JSON.stringify(data, null, 2));
    }

    console.log(`Success! Created ${COUNT} entries for each entity`);
    console.log(`User data saved to: ${OUT_USERS_FILE}`);
    console.log(`Teams data saved to: ${OUT_TEAMS_FILE}`);
    console.log(`Tags data saved to: ${OUT_TAGS_FILE}`);
}

async function clearDB(db) {
    console.log('Cleaning up ONLY k6 test data...');
    return await db.transaction(async (tx) => {
        await tx.delete(sc.users).where(sql`${sc.users.email} LIKE 'k6_user_%'`);
        await tx.delete(sc.teams).where(sql`${sc.teams.name} LIKE 'k6_team_%'`);
        await tx.delete(sc.tags).where(sql`${sc.tags.name} LIKE 'k6_tag_%'`);
    });
}

async function main() {
    if (!DB_URL) throw new Error('DATABASE_URL is not defined in .env');

    const pool = new Pool({ connectionString: DB_URL });
    const db = drizzle(pool, { schema: sc });
    try {
        await clearDB(db);
        await seed(db);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
