import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup.ts',
  globalTeardown: './support/global-teardown.ts',
  projects: [{ name: 'api', testDir: resolve(import.meta.dirname, 'api') }],
  webServer: [
    { command: 'bun start.ts', cwd: '../server' },
    { command: 'NODE_ENV=test node "mock-api.ts" > mock-api.log && "./launch.mjs"' },
  ],
});
