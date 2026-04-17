import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            include: ['test/**/*.e2e-spec.ts'],
            exclude: [],
            pool: 'forks',
            isolate: true,
        },
    }),
);
