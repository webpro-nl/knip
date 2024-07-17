import { nxE2EPreset } from '@nrwl/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

const cypressJsonConfig = {};

export default defineConfig({
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    configFile: 'reporter-config.json',
  },
  e2e: {
    ...nxE2EPreset(__dirname, {}),
    ...cypressJsonConfig,
  },
});
