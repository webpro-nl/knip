import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  reporter: [['./esmodule-reporter.mts']],
};

export default config;
