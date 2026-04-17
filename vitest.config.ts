import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        root: './',
        globals: true,
        environment: 'node',
        include: ['**/*.spec.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/infra/**',
        ],
        alias: {
            '@core': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@libs/bootstrap': path.join(process.cwd(), 'libs/bootstrap/src'),
            '@libs/config': path.join(process.cwd(), 'libs/config/src'),
            '@libs/database': path.join(process.cwd(), 'libs/database/src'),
            '@libs/health': path.join(process.cwd(), 'libs/health/src'),
            '@libs/s3': path.join(process.cwd(), 'libs/s3/src'),
        },
        typecheck: {
            enabled: true,
        },
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src'),
        },
    },
});
