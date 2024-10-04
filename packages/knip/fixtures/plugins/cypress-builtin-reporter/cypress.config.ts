import { nxE2EPreset } from '@nrwl/cypress/plugins/cypress-preset';
import { defineConfig } from 'cypress';

const cypressJsonConfig = {};

export default defineConfig({
  reporter: "junit",
  e2e: {
    ...nxE2EPreset(__dirname, {}),
    ...cypressJsonConfig,
  },
});
