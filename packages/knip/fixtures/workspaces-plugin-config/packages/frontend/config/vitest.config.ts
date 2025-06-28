import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    root: '..',
    include: ['**/*.vitest.ts'],
    environment: 'jsdom',
  },
});
