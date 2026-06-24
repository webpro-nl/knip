import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    dedupe: ['shared-state'],
  },
  optimizeDeps: {
    include: ['linked-package', 'upstream-esm > nested-commonjs'],
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['setup.js', './src/setupTests.ts'],
    coverage: {
      reporter: ['html', 'lcov'],
      provider: 'istanbul',
    },
  },
});
