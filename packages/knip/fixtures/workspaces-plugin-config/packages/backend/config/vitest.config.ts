import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '..',
    include: ['**/*.vitest.ts'],
    environment: 'node',
  },
});
