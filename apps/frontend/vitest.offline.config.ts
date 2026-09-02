import { defineConfig } from 'vitest/config';

/**
 * Config for the offline (IndexedDB / localStorage) property suites.
 *
 * They are excluded from the default `npm test` run because they are an order
 * of magnitude slower than the rest of the unit tests. Run them explicitly:
 *
 *   npm run test:offline
 *
 * Standalone rather than merged with vite.config.ts, because mergeConfig
 * concatenates the `exclude` array instead of replacing it.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/services/offline*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 120000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
  },
});
