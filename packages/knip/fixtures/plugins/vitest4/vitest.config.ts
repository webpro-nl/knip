import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: 'tests',
    include: ['*.test.ts'],
    setupFiles: ['./setup.ts'],
  },
});
