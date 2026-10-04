import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: { command: 'npm run serve -- server.ts', cwd: 'packages/app' },
});
