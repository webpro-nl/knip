import { defineConfig } from 'vitest/config';

export default defineConfig(async ({ mode, command }) => {
  if (mode === 'development') {
    return {
      test: {
        coverage: {
          reporter: ['html', 'lcov'],
          provider: 'c8',
        },
      },
    };
  }
  if (mode === 'production') {
    return {
      test: {
        environment: 'edge-runtime',
      },
    };
  }
});
