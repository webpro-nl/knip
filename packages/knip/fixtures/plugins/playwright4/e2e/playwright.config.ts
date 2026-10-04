import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: [{ command: 'bun start.ts', cwd: '../server' }, { command: 'node mock-api.ts' }],
});
