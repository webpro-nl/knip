import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['./*.test.ts'],
  exclude: ['./excluded.test.ts'],
  testEnvironment: { name: 'happy-dom', prebundle: 'auto' },
});
