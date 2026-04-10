import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        root: './',
        environment: 'node',
        include: ['**/*.spec.ts'],
        alias: {
            '@libs/config': path.resolve(__dirname, './libs/config/src'),
            '@libs/database': path.resolve(__dirname, './libs/database/src'),
            '@src': path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        swc.vite({
            module: { type: 'es6' },
        }),
    ],
});
