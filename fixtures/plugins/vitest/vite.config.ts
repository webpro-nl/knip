import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'edge-runtime',
    setupFiles: ['./setup.js'],
    globalSetup: ['global.ts'],
    coverage: {
      reporter: ['html', 'lcov'],
      provider: 'c8',
    },
  },
});
