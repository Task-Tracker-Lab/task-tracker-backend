import * as dotenv from 'dotenv';
dotenv.config();

import { createId } from '@paralleldrive/cuid2';
import * as argon from 'argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as sc from '../../../src/modules/user/entities';
import { sql } from 'drizzle-orm';

async function seed() {
    const DB_URL = process.env.DATABASE_URL;
    if (!DB_URL) throw new Error('DATABASE_URL is not defined in .env');

    const COUNT = 1000;
    const OUT_FILE = resolve(process.cwd(), 'infra/k6/data/users.json');

    console.log(`Start seeding ${COUNT} users using pg driver...`);

    const pool = new Pool({ connectionString: DB_URL });
    const db = drizzle(pool, { schema: sc });

    const password = 'TestPassword123!';
    const passwordHash = await argon.hash(password);

    const usersToInsert = [];
    const securityToInsert = [];
    const notificationsToInsert = [];
    const activitiesToInsert = [];
    const k6Data = [];

    for (let i = 0; i < COUNT; i++) {
        const userId = createId();
        const email = `k6_user_${i}@tasktracker.com`;

        usersToInsert.push({
            id: userId,
            email,
            firstName: 'K6',
            lastName: `User ${i}`,
            timezone: 'UTC',
            language: 'ru',
        });

        securityToInsert.push({ userId, passwordHash });

        notificationsToInsert.push({ userId });

        k6Data.push({ email, password });

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

    console.log('Cleaning up ONLY k6 test users...');
    await db.transaction(async (tx) => {
        await tx.delete(sc.users).where(sql`${sc.users.email} LIKE 'k6_user_%'`);
    });

    console.log('Inserting new test users');
    try {
        await db.transaction(async (tx) => {
            await tx.insert(sc.users).values(usersToInsert);
            await tx.insert(sc.userSecurity).values(securityToInsert);
            await tx.insert(sc.userNotifications).values(notificationsToInsert);

            const chunkSize = 1000;
            for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
                const chunk = activitiesToInsert.slice(i, i + chunkSize);
                console.log(`Inserting activities chunk: ${i} to ${i + chunkSize}...`);
                await tx.insert(sc.userActivity).values(chunk);
            }
        });

        mkdirSync(dirname(OUT_FILE), { recursive: true });
        writeFileSync(OUT_FILE, JSON.stringify(k6Data, null, 2));

        console.log(`Success! ${COUNT} users created.`);
        console.log(`Credentials saved to: ${OUT_FILE}`);
    } catch (e) {
        console.error('Seed failed:', e);
    } finally {
        await pool.end();
    }
}

seed();
