import { defineConfig } from '@rstest/core';

export default defineConfig(({ envMode }) => ({
  name: envMode,
  root: 'src',
  include: ['**/*.check.ts', '!**/ignored.check.ts'],
  exclude: {
    patterns: ['skipped.check.ts'],
  },
  setupFiles: './setup/per-file.ts',
  globalSetup: './setup/global.ts',
}));
