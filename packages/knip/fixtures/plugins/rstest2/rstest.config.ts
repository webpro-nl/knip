import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['./*.test.ts'],
  exclude: ['./excluded.test.ts'],
});
