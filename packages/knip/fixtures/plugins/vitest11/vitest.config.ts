import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: 'tests',
    include: ['*.test.ts'],
    setupFiles: ['./setup.ts'],
  },
});
