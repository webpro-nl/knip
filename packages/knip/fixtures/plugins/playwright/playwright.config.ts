import { devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  globalSetup: './setup/[browser]/prepare.ts',
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome'],
    },
  ],
  reporter: ['html', ['junit', { outputFile: '' }], ['./custom-reporter.ts']],
};

export default config;
