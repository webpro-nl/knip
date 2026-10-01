import { defineProject } from 'vitest/config';
import { include } from '@/vitest-include';

export default defineProject({
  test: {
    root: '..',
    include,
    environment: 'jsdom',
  },
});
