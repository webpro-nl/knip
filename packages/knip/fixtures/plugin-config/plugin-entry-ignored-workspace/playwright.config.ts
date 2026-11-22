import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: [],
  webServer: { cwd: 'packages/ignored', command: 'mocha "*.ts"' },
});
