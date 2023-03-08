import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'edge-runtime',
    coverage: {
      reporter: ['html', 'lcov'],
      provider: 'c8',
    },
  },
});
