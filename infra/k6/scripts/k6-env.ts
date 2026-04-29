import * as dotenv from 'dotenv';

dotenv.config();

export const DB_URL = process.env.DATABASE_URL;
export const REDIS_URL =
    process.env.REDIS_HOST && process.env.REDIS_PORT
        ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        : undefined;

export function assertEnv() {
    if (!DB_URL || !REDIS_URL) {
        throw new Error('DATABASE_URL OR REDIS_HOST, REDIS_PORT  is not defined in .env');
    }
}
