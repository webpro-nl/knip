import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  webServer: [
    { command: 'bun start.ts', cwd: '../server' },
    { command: 'NODE_ENV=test node "mock-api.ts" > mock-api.log && "./launch.mjs"' },
  ],
});
