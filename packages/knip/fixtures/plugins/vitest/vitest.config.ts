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
    snapshotSerializers: ['./src/htmlSnapshotSerializer.ts', 'snapshot-serializer.js'],
    coverage: {
      reporter: ['html', 'lcov'],
      provider: 'istanbul',
    },
  },
});
