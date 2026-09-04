import { defineConfig } from '@rstest/core';

export default defineConfig({
  testEnvironment: { name: 'happy-dom', prebundle: 'auto' },
});
