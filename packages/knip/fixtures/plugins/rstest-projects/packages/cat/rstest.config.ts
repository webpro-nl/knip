import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['meow.check.ts'],
  globalSetup: ['./global-setup.ts'],
  browser: {
    enabled: true,
  },
});
