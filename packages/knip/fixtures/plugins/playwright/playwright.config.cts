import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  reporter: [['./commonjs-typescript-reporter.cts']],
};

export default config;
